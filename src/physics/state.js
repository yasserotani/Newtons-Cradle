// src/physics/state.js
// Pure data storage. No physics math lives here — only ball creation/reset.

import { CONFIG, computeCradleWidth } from "../constants.js";
import { updateCartesianCoordinates } from "./motion.js";

export const pendulumBalls = [];

// Removed the `environment` export ({ gravity, damping }) — nothing in the
// files you shared imported it, gravity now lives solely on CONFIG.gravity,
// and its `damping: 0.999` was a third, disconnected damping value on top
// of PHYSICS.VISCOUS_K (the one actually used in motion.js). If some other
// file you have imports `environment` from here, it'll now throw — worth a
// quick search before dropping this in.
//
// Removed `updateBallMass(ballId, newMass)` too — also unreferenced in the
// physics/UI/main files you shared. Mass changes currently flow through
// main.js rebuilding CONFIG.masses and calling physics.reset(), which
// rebuilds pendulumBalls from scratch via initPhysicsSystem() below — that
// already fully covers mass updates, so this was a redundant, unused path
// (mutating a ball's mass in place without a reset, which nothing called).

/**
 * Builds the pendulumBalls array from scratch based on the LIVE CONFIG
 * values. Uses the dynamic cradleWidth to calculate spacing so that the
 * physics anchor points perfectly match the 3D visual anchor points.
 * Balls are always initialized at rest (angle 0, velocity 0).
 * Initial launch angle will be applied externally.
 */
export function initPhysicsSystem() {
  pendulumBalls.length = 0;

  // 1. Calculate the cradle width using the shared function
  const cradleWidth = computeCradleWidth(CONFIG);

  // 2. Derive the exact spacing between the anchoring points
  const spacing = CONFIG.ballCount > 1 ? cradleWidth / (CONFIG.ballCount - 1) : 0;

  // 3. Compute the starting left-most position offset
  const startX = -cradleWidth / 2;

  for (let i = 0; i < CONFIG.ballCount; i++) {
    const pivotX = startX + i * spacing;
    const pivotY = CONFIG.supportHeight;
    const angle = 0; // Always start at angle 0, motion will be applied externally

    const newBall = {
      id: i,
      pivotX,
      pivotY,
      angle,
      velocity: 0, // angular velocity (rad/s)
      radius: CONFIG.ballRadius,
      mass: CONFIG.masses?.[i] ?? 1,
      x: 0, // Will be updated by updateCartesianCoordinates
      y: 0, // Will be updated by updateCartesianCoordinates
      held: false,
    };
    // Update Cartesian coordinates to reflect the initial angle (0)
    updateCartesianCoordinates(newBall, CONFIG.threadLength);
    pendulumBalls.push(newBall);
  }
}

/**
 * Resets all balls to hanging straight down, zero velocity.
 */
export function resetSystem() {
  pendulumBalls.forEach((ball) => {
    ball.angle = 0;
    ball.velocity = 0;
    // Update Cartesian coordinates to reflect the reset angle (0)
    updateCartesianCoordinates(ball, CONFIG.threadLength);
    ball.held = false;
  });
}