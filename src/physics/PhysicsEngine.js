// src/physics/PhysicsEngine.js
// Thin orchestrator only — all real physics lives in motion.js / collision.js.
// Exists so main.js can keep using `new PhysicsEngine(config)` / .update() /
// .getPositions() / .getStatus() / .reset() exactly as before.

import {
  pendulumBalls,
  initPhysicsSystem,
  resetSystem,
} from "./state.js";
import { updateAllPendulums, getTotalSystemEnergy, updateCartesianCoordinates } from "./motion.js";
import { handleAllCollisions, getLastCollisionCount } from "./collision.js";
import { CONFIG, PHYSICS } from "../constants.js";

export class PhysicsEngine {
  constructor(config) {
    this.config = config;
    Object.assign(CONFIG, config); // keep constants.js's CONFIG in sync
    this.totalCollisions = 0;
    this.lastEnergy = null; // used to compute energyTransfer per frame
    this.infiniteMotion = false; // Initialize infiniteMotion
    this.reset();
  }

  reset() {
    Object.assign(CONFIG, this.config);
    initPhysicsSystem();
    this.totalCollisions = 0;
    this.lastEnergy = null;
  }

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

  getLastFrameCollisionCount() {
    return this.lastFrameCollisions ?? 0;
  }

  // New method: sets pendulumBalls[index].held
  setBallHeld(index, isHeld) {
    if (index >= 0 && index < pendulumBalls.length) {
      pendulumBalls[index].held = isHeld;
      if (isHeld) {
        // When held, stop its motion
        pendulumBalls[index].velocity = 0;
      }
    }
  }

  // New method: clamps angle, sets ball's angle/velocity, updates Cartesian coords
  setBallAngle(index, angle) {
    if (index >= 0 && index < pendulumBalls.length) {
      const ball = pendulumBalls[index];
      // Clamp angle to a reasonable range to prevent visual glitches
      const MAX_DRAG_ANGLE = 1.4; // Approximately 80 degrees
      const clampedAngle = Math.max(-MAX_DRAG_ANGLE, Math.min(MAX_DRAG_ANGLE, angle));

      ball.angle = clampedAngle;
      ball.velocity = 0; // Held ball has no velocity

      // Update Cartesian coordinates to reflect the new angle
      updateCartesianCoordinates(ball, CONFIG.threadLength);
    }
  }

  /**
   * Applies an initial launch angle to a specified number of balls.
   * @param {number} angle - The angle to set for the lifted balls.
   * @param {number} liftedBallCount - The number of balls to lift from one side.
   */
  applyInitialLaunchState(angle, liftedBallCount) {
    // Ensure all balls are reset to hanging straight down first
    resetSystem();

    // Apply the initial angle to the specified number of balls
    for (let i = 0; i < pendulumBalls.length; i++) {
      const ball = pendulumBalls[i];
      if (i < liftedBallCount) {
        ball.angle = angle;
        ball.velocity = 0; // Start from rest at the lifted angle
      } else {
        ball.angle = 0;
        ball.velocity = 0;
      }
      // Update Cartesian coordinates for all balls to reflect their new angles
      updateCartesianCoordinates(ball, CONFIG.threadLength);
    }
  }

  // Backward-compat: anything that still reads physics.balls directly
  // (instead of getPositions()) will keep working.
  get balls() {
    return pendulumBalls;
  }

  getPositions() {
    return pendulumBalls.map((ball) => ({ x: ball.x, y: ball.y, z: 0 }));
  }

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

    const averageAngle =
        pendulumBalls.reduce((sum, b) => sum + b.angle, 0) /
        pendulumBalls.length;
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