// src/constants.js

export const PHYSICS = {
  GRAVITY: 9.81,
  AIR_DAMPING: 0.998,
  FIXED_DT: 1 / 120,
  CONSTRAINT_ITERATIONS: 5,
  VISCOUS_K: 0.002, // Added VISCOUS_K here
};

export const COLLISION = {
  SEPARATION_EPSILON: 1e-6,
  MIN_IMPULSE_FOR_SOUND: 0.05,
};

export const CONFIG = {
  ballCount: 5,
  ballRadius: 0.4,
  threadLength: 2.0,
  supportHeight: 3.0,
  spreadZ: 0.6,
  cradleWidth: 3.2,
  initialLaunchAngle: -0.7,
  liftedBallCount: 1,
  gravity: 9.81,
  restitution: 1.0,
  masses: [1, 1, 1, 1, 1, 1],
  colors: {
    ball: 0xffaa00,
    thread: 0xcccccc,
    support: 0x444466,
  },
};

// CRADLE describes the resting layout — used by state.js to place balls.
// Derived from CONFIG so there's only one source of truth for geometry.
export const CRADLE = {
  NUM_BALLS: CONFIG.ballCount,
  BALL_RADIUS: CONFIG.ballRadius,
  BALL_SPACING: 0.02, // small gap so resting balls just touch, not overlap
};

// PENDULUM.DEFAULT_LENGTH now mirrors CONFIG.threadLength instead of being
// a separate hardcoded "10" — previously motion.js and state.js disagreed
// on string length, which would have caused wrong swing speeds.
export const PENDULUM = {
  DEFAULT_LENGTH: CONFIG.threadLength,
};

export function computeCradleWidth(config) {
  return config.cradleWidth ?? config.ballCount * config.ballRadius * 1.7;
}