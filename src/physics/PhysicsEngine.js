
import {initPhysicsSystem, pendulumBalls, resetSystem} from "./state.js";
import {getTotalSystemEnergy, updateAllPendulums} from "./motion.js"; // Removed updateCartesianCoordinates
import {getLastCollisionCount, handleAllCollisions} from "./collision.js";
import {CONFIG, PHYSICS} from "../constants.js";

export class PhysicsEngine {
  constructor(config) {
    this.config = config;
    Object.assign(CONFIG, config);
    this.totalCollisions = 0;
    this.lastEnergy = null;
    this.infiniteMotion = false;
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
    const substeps = Math.max(1, Math.ceil(safeDt / PHYSICS.FIXED_DT));
    const stepDt = safeDt / substeps;

    this.lastFrameCollisions = 0;
    for (let i = 0; i < substeps; i += 1) {
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

  setBallHeld(index, isHeld) {
    if (index >= 0 && index < pendulumBalls.length) {
      pendulumBalls[index].setHeld(isHeld);
    }
  }

  setBallAngle(index, angle) {
    if (index >= 0 && index < pendulumBalls.length) {
      const ball = pendulumBalls[index];
      ball.setAngle(angle, CONFIG.threadLength);
    }
  }


 // Applies an initial launch angle to a specified number of balls
  applyInitialLaunchState(angle, liftedBallCount) {
    resetSystem();

    const angleInRadians = angle * (Math.PI / 180);

    for (let i = 0; i < pendulumBalls.length; i++) {
      const ball = pendulumBalls[i];
      if (i < liftedBallCount) {
        ball.setAngle(angleInRadians, CONFIG.threadLength);
      } else {
        ball.setAngle(0, CONFIG.threadLength);
      }
    }
  }

  get balls() {
    return pendulumBalls;
  }

  getPositions() {
    return pendulumBalls.map((ball) => ({ x: ball.x, y: ball.y, z: 0 }));
  }

  getStatus() {
    const L = CONFIG.threadLength;


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


    const ballVelocities = pendulumBalls.map((b) => b.velocity * L);
    const ballAngles = pendulumBalls.map((b) => b.angle);

    const averageAngle =
      pendulumBalls.reduce((sum, b) => sum + b.angle, 0) / pendulumBalls.length;
    const averageAngularVelocity =
      pendulumBalls.reduce((sum, b) => sum + b.velocity, 0) /
      pendulumBalls.length;

    const { K, U, E } = getTotalSystemEnergy();

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
      totalEnergy: E,
      energyTransfer,
      collisions: this.totalCollisions,
      activeBall: activeBall >= 0 ? activeBall + 1 : 0,
      ballVelocities,
      ballAngles,
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