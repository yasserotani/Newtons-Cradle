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

export const CONFIG = {
    ballCount: 4,
    ballRadius: 0.4,
    threadLength: 2.0,
    supportHeight: 3.0,
    spreadZ: 0.6,
    cradleWidth: 3.2,
    colors: {
        ball: 0xffaa00,
        thread: 0xcccccc,
        support: 0x444466
    }
};

// Added this missing section:
export const PENDULUM = {
  DEFAULT_LENGTH: 10, // This matches the pivot height (y=10) used in your state.js
};
