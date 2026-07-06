// src/physics/PhysicsEngine.js
// Thin orchestrator only — all real physics lives in motion.js / collision.js.
// Exists so main.js can keep using `new PhysicsEngine(config)` / .update() /
// .getPositions() / .getStatus() / .reset() exactly as before.

import {initPhysicsSystem, pendulumBalls, resetSystem} from "./state.js";
import {getTotalSystemEnergy, updateAllPendulums} from "./motion.js"; // Removed updateCartesianCoordinates
import {getLastCollisionCount, handleAllCollisions} from "./collision.js";
import {CONFIG, PHYSICS} from "../constants.js";

export class PhysicsEngine {
  // Initializes the PhysicsEngine with a given configuration.
  constructor(config) {
    this.config = config;
    Object.assign(CONFIG, config); // keep constants.js's CONFIG in sync
    this.totalCollisions = 0;
    this.lastEnergy = null; // used to compute energyTransfer per frame
    this.infiniteMotion = false; // Initialize infiniteMotion
    this.reset();
  }

  // Resets the physics system to its initial state.
  reset() {
    Object.assign(CONFIG, this.config);
    initPhysicsSystem();
    this.totalCollisions = 0;
    this.lastEnergy = null;
  }

  // Updates the physics simulation by a given time step.
  update(dt) {
    const safeDt = Math.min(Math.max(dt, 0), 0.03);
    // FIX: was a hardcoded `1 / 120` — now reads the single declared
    // constant so FIXED_DT can't drift out of sync with itself again.
    const substeps = Math.max(1, Math.ceil(safeDt / PHYSICS.FIXED_DT));
    const stepDt = safeDt / substeps;

    this.lastFrameCollisions = 0;
    for (let i = 0; i < substeps; i += 1) {
      // Pass the infiniteMotion flag to updateAllPendulums
      updateAllPendulums(stepDt, this.infiniteMotion);
      handleAllCollisions();
      const c = getLastCollisionCount();
      this.totalCollisions += c;
      this.lastFrameCollisions += c;
    }
  }

  // Returns the number of collisions that occurred in the last frame.
  getLastFrameCollisionCount() {
    return this.lastFrameCollisions ?? 0;
  }

  // Sets the held state of a specific ball.
  setBallHeld(index, isHeld) {
    if (index >= 0 && index < pendulumBalls.length) {
      pendulumBalls[index].setHeld(isHeld);
    }
  }

  // Sets the angle of a specific ball.
  setBallAngle(index, angle) {
    if (index >= 0 && index < pendulumBalls.length) {
      const ball = pendulumBalls[index];
      ball.setAngle(angle, CONFIG.threadLength);
    }
  }

  /**
   * Applies an initial launch angle to a specified number of balls.
   * @param {number} angle - The angle to set for the lifted balls (in degrees).
   * @param {number} liftedBallCount - The number of balls to lift from one side.
   */
  applyInitialLaunchState(angle, liftedBallCount) {
    // Ensure all balls are reset to hanging straight down first
    resetSystem();

    // Convert angle from degrees to radians for physics calculations
    const angleInRadians = angle * (Math.PI / 180);

    // Apply the initial angle to the specified number of balls
    for (let i = 0; i < pendulumBalls.length; i++) {
      const ball = pendulumBalls[i];
      if (i < liftedBallCount) {
        // Use setAngle method for consistency and internal coordinate update
        ball.setAngle(angleInRadians, CONFIG.threadLength);
      } else {
        // Reset to 0 angle if not lifted
        ball.setAngle(0, CONFIG.threadLength);
      }
      // No need to call updateCartesianCoordinates explicitly here, as setAngle does it.
    }
  }

  // Returns the array of pendulum balls.
  get balls() {
    return pendulumBalls;
  }

  // Returns the current Cartesian positions of all balls.
  getPositions() {
    return pendulumBalls.map((ball) => ({ x: ball.x, y: ball.y, z: 0 }));
  }

  // Returns the current status of the physics engine, including energy, momentum, and ball states.
  getStatus() {
    const L = CONFIG.threadLength;

    // v = ω·L (paper page 5) — linear velocity, in m/s, not raw angular
    // velocity.
    const velocity = pendulumBalls.reduce(
      (sum, b) => sum + Math.abs(b.velocity) * L,
      0,
    );
    const momentum = pendulumBalls.reduce(
      (sum, b) => sum + (b.mass || 1) * Math.abs(b.velocity) * L,
      0,
    );
    const activeBall = pendulumBalls.findIndex(
      (b) => Math.abs(b.velocity) > 0.001,
    );

    // NEW: per-ball linear velocity (signed, m/s). This is what was
    // missing for the UI — previously only the *summed* velocity across
    // all balls was exposed, so there was no way for the chart to show
    // which individual ball(s) were actually moving.
    const ballVelocities = pendulumBalls.map((b) => b.velocity * L);
    const ballAngles = pendulumBalls.map((b) => b.angle); // NEW: individual ball angles

    const averageAngle =
      pendulumBalls.reduce((sum, b) => sum + b.angle, 0) / pendulumBalls.length;
    const averageAngularVelocity =
      pendulumBalls.reduce((sum, b) => sum + b.velocity, 0) /
      pendulumBalls.length;

    const { K, U, E } = getTotalSystemEnergy();

    // energyTransfer: how much total energy was lost since the last frame
    let energyTransfer = 0;
    if (this.lastEnergy !== null) {
      energyTransfer = Math.max(0, this.lastEnergy - E);
    }
    this.lastEnergy = E;

    return {
      velocity,
      momentum,
      kineticEnergy: K,
      potentialEnergy: U,
      totalEnergy: E, // should trend downward over time
      energyTransfer,
      collisions: this.totalCollisions,
      activeBall: activeBall >= 0 ? activeBall + 1 : 0,
      ballVelocities, // NEW — feeds UIManager's per-ball activity chart
      ballAngles, // NEW: individual ball angles
      damping: PHYSICS.VISCOUS_K,
      gravity: this.config.gravity,
      restitution: this.config.restitution ?? 1.0,
      ballCount: this.config.ballCount,
      ballRadius: this.config.ballRadius,
      mass: this.config.masses?.[0] ?? 1,
      initialLaunchAngle: this.config.initialLaunchAngle,
      liftedBallCount: this.config.liftedBallCount,
      averageAngle,
      averageAngularVelocity,
      contactDistance: (this.config.ballRadius ?? 0.4) * 2,
    };
  }
}