export const PHYSICS = {
  GRAVITY: 9.81,
  AIR_DAMPING: 0.998,
  FIXED_DT: 1 / 120,
  CONSTRAINT_ITERATIONS: 5,
};

export const COLLISION = {
  SEPARATION_EPSILON: 1e-6,
  MIN_IMPULSE_FOR_SOUND: 0.05,
};

export const CRADLE = {
  NUM_BALLS: 5,
  BALL_RADIUS: 0.5,
  BALL_SPACING: 0.4,
  ROPE_STIFFNESS: 800.0,
  ROPE_DAMPING: 0.5,
};

// Added this missing section:
export const PENDULUM = {
  DEFAULT_LENGTH: 10, // This matches the pivot height (y=10) used in your state.js
};
