// src/constants.js

export const PHYSICS = {
  FIXED_DT: 1 / 480,
  VISCOUS_K: 0.1,
};

export const COLLISION = {
  SEPARATION_EPSILON: 1e-6,
  MIN_IMPULSE_FOR_SOUND: 0.05,
  SOLVER_ITERATIONS: 30,
};

export const CONFIG = {
  ballCount: 5,
  ballRadius: 0.4,
  threadLength: 2.0,
  supportHeight: 3.0,
  spreadZ: 0.6,
  initialLaunchAngle: -60,
  liftedBallCount: 1,
  gravity: 9.81,
  restitution: 0.99,
  masses: [10, 10, 10, 10, 10],
  colors: {
    ball: 0xffaa00,
    thread: 0xcccccc,
    support: 0x444466,
  },
};


export function computeCradleWidth(config) {
  return config.ballCount > 1
    ? 2 * config.ballRadius * (config.ballCount - 1)
    : 0;
}