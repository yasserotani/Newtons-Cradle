// src/physics/state.js
// Pure data storage. No physics math lives here — only ball creation/reset.

import { CONFIG, computeCradleWidth } from "../constants.js";
import { Ball } from "./Ball.js"; // Import the new Ball class

export const pendulumBalls = [];

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
    const velocity = 0; // angular velocity (rad/s)
    const radius = CONFIG.ballRadius;
    const mass = CONFIG.masses?.[i] ?? 1;
    const threadLength = CONFIG.threadLength;

    const newBall = new Ball(
      i,
      pivotX,
      pivotY,
      angle,
      velocity,
      radius,
      mass,
      threadLength
    );
    // The Ball constructor already calls updateCartesianCoordinates
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
    // Update Cartesian coordinates to reflect the reset angle (0) using the Ball's method
    ball.updateCartesianCoordinates(CONFIG.threadLength);
    ball.held = false;
  });
}