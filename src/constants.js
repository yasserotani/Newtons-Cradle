// src/constants.js

// PHYSICS holds fixed, non-user-adjustable engine tuning knobs — things
// with no GUI slider. gravity is deliberately NOT here: it used to be
// (as a hardcoded PHYSICS.GRAVITY), which was the bug. motion.js was
// reading that frozen copy while the gravity slider was only ever
// updating CONFIG.gravity, a completely different object. Result: moving
// the slider changed a number nothing read, so gravity looked broken.
// Fix: gravity now lives in exactly one place, CONFIG.gravity, and every
// physics calculation reads from there.
export const PHYSICS = {
  FIXED_DT: 1 / 120, // now actually used by PhysicsEngine.update() (was hardcoded 1/120 there before)
  VISCOUS_K: 0.1, // angular-velocity-proportional damping, not user-facing
};

// Removed PHYSICS.AIR_DAMPING and PHYSICS.CONSTRAINT_ITERATIONS — grepped
// the whole physics package (state/motion/collision/PhysicsEngine) and
// neither was read anywhere. motion.js already defines its own local
// RHO_AIR/CD for air drag, and collision.js resolves in a single impulse
// pass with no constraint-iteration loop. If you find these referenced
// somewhere outside the files I was given, ping me and I'll restore them.

export const COLLISION = {
  SEPARATION_EPSILON: 1e-6,
  MIN_IMPULSE_FOR_SOUND: 0.05, // left in place — likely consumed by AudioManager, which I don't have visibility into
};

// CONFIG is the single source of truth for every LIVE, user-adjustable
// simulation parameter. UIManager's sliders write here (via PhysicsEngine
// syncing CONFIG on reset), and every physics calculation should read
// from here — never duplicate one of these values as a second constant
// elsewhere, that's exactly what caused the gravity bug.
export const CONFIG = {
  ballCount: 5,
  ballRadius: 0.4,
  threadLength: 2.0,
  supportHeight: 3.0,
  spreadZ: 0.6, // overwritten dynamically in main.js from cradleWidth
  initialLaunchAngle: -0.7,
  liftedBallCount: 1,
  gravity: 9.81, // <-- the ONLY gravity value any physics code should read
  restitution: 0.95,
  masses: [1, 1, 1, 1, 1], // trimmed to match default ballCount (was 6 entries for 5 balls)
  colors: {
    ball: 0xffaa00,
    thread: 0xcccccc,
    support: 0x444466,
  },
};

// CRADLE / PENDULUM: I couldn't find any import of these in the six files
// you shared (state.js builds spacing from computeCradleWidth() directly,
// not from CRADLE.BALL_SPACING). They're very likely consumed by
// graphics/builders/CradleBuilder.js, which I haven't seen, so I'm
// leaving them untouched rather than guessing. Worth a quick search in
// your editor for "CRADLE" / "PENDULUM" to confirm before deleting.
export const CRADLE = {
  NUM_BALLS: CONFIG.ballCount,
  BALL_RADIUS: CONFIG.ballRadius,
  BALL_SPACING: 0.02,
};

export const PENDULUM = {
  DEFAULT_LENGTH: CONFIG.threadLength,
};

export function computeCradleWidth(config) {
  return config.ballCount * config.ballRadius * 1.7;
}