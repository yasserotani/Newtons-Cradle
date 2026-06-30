// src/physics/PhysicsEngine.js
// Thin orchestrator only — all real physics lives in motion.js / collision.js.
// Exists so main.js can keep using `new PhysicsEngine(config)` / .update() /
// .getPositions() / .getStatus() / .reset() exactly as before.

import {
  pendulumBalls,
  initPhysicsSystem,
  resetSystem,
} from "./state.js";
import { updateAllPendulums, getTotalSystemEnergy, updateCartesianCoordinates } from "./motion.js"; // Import updateCartesianCoordinates
import { handleAllCollisions, getLastCollisionCount } from "./collision.js";
import { CONFIG } from "../constants.js";

const VISCOUS_K = 0.002; // mirrors K_DAMPING in motion.js (paper page 19's k)

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

  setInitialState({ angle, liftedBallCount } = {}) {
    if (typeof angle === "number") this.config.initialLaunchAngle = angle;
    if (typeof liftedBallCount === "number") {
      this.config.liftedBallCount = liftedBallCount;
    }
    this.reset();
  }

  update(dt) {
    const safeDt = Math.min(Math.max(dt, 0), 0.03);
    const substeps = Math.max(1, Math.ceil(safeDt / (1 / 120)));
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
      // User requested "not more than 90%", interpreting as approx 90% of PI/2 (90 degrees from vertical)
      // Math.PI / 2 is ~1.57 radians. 90% of that is ~1.41 radians.
      const MAX_DRAG_ANGLE = 1.4; // Approximately 80 degrees
      const clampedAngle = Math.max(-MAX_DRAG_ANGLE, Math.min(MAX_DRAG_ANGLE, angle));

      ball.angle = clampedAngle;
      ball.velocity = 0; // Held ball has no velocity

      // Update Cartesian coordinates to reflect the new angle
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
    // velocity. Previously these summed |ω| directly, which is missing
    // the L factor and isn't actually a valid velocity or momentum.
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
    const averageAngle =
        pendulumBalls.reduce((sum, b) => sum + b.angle, 0) /
        pendulumBalls.length;
    const averageAngularVelocity =
        pendulumBalls.reduce((sum, b) => sum + b.velocity, 0) /
        pendulumBalls.length;

    const { K, U, E } = getTotalSystemEnergy();

    // energyTransfer: how much total energy was lost since the last frame
    // (paper page 16's dE/dt, just expressed per-frame instead of per-second)
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
      damping: VISCOUS_K,
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