// src/constants.js

export const PHYSICS = {
  FIXED_DT: 1 / 480, // Reduced to improve numerical integration accuracy and minimize energy loss
  VISCOUS_K: 0.001, // angular-velocity-proportional damping, reduced to minimize energy loss
};

export const COLLISION = {
  SEPARATION_EPSILON: 1e-6,
  MIN_IMPULSE_FOR_SOUND: 0.05,
  SOLVER_ITERATIONS: 30, // Increased to allow for more robust collision resolution
};

export const CONFIG = {
  ballCount: 5,
  ballRadius: 0.4,
  threadLength: 2.0,
  supportHeight: 3.0,
  spreadZ: 0.6,
  initialLaunchAngle: -60, // Changed to -60 degrees
  liftedBallCount: 1,
  gravity: 9.81,
  restitution: 1.0, // Set to 1.0 for perfectly elastic collisions
  masses: [10, 10, 10, 10, 10], // Increased default mass for all balls
  colors: {
    ball: 0xffaa00,
    thread: 0xcccccc,
    support: 0x444466,
  },
};

export const CRADLE = {
  NUM_BALLS: CONFIG.ballCount,
  BALL_RADIUS: CONFIG.ballRadius,
  BALL_SPACING: 0.02,
};

export const PENDULUM = {
  DEFAULT_LENGTH: CONFIG.threadLength,
};

// FIX: previously `ballCount * ballRadius * 1.7`, which spaced pivots
// wider than the ball diameter — resting balls had a visible gap between
// them. That gap meant the swinging ball's impulse had to "re-launch"
// across a tiny free-flight at every link instead of transferring through
// one continuous contact chain, which is what caused the middle balls to
// twitch and the end ball to come up short of the input angle even at
// restitution = 1.
//
// Spacing must equal exactly 2 * ballRadius so balls sit flush at rest
// (angle = 0 means cartesian spacing == pivot spacing).
export function computeCradleWidth(config) {
  return config.ballCount > 1
    ? 2 * config.ballRadius * (config.ballCount - 1)
    : 0;
}