// src/physics/state.js
// Pure data storage. No physics math lives here — only ball creation/reset.

import { CONFIG, computeCradleWidth } from "../constants.js"; // Import computeCradleWidth

export const pendulumBalls = [];

export const environment = {
  gravity: CONFIG.gravity,
  damping: 0.999,
};

/**
 * Builds the pendulumBalls array from scratch based on the LIVE CONFIG
 * values. Uses the dynamic cradleWidth to calculate spacing so that the
 * physics anchor points perfectly match the 3D visual anchor points.
 */
export function initPhysicsSystem() {
  pendulumBalls.length = 0;

  const liftedBallCount = Math.max(
      1,
      Math.min(CONFIG.ballCount, CONFIG.liftedBallCount ?? 1),
  );

  // 1. Calculate the cradle width using the shared function
  const cradleWidth = computeCradleWidth(CONFIG);

  // 2. Derive the exact spacing between the anchoring points
  const spacing = CONFIG.ballCount > 1 ? cradleWidth / (CONFIG.ballCount - 1) : 0;

  // 3. Compute the starting left-most position offset
  const startX = -cradleWidth / 2;

  for (let i = 0; i < CONFIG.ballCount; i++) {
    const pivotX = startX + (i * spacing);
    const pivotY = CONFIG.supportHeight;
    const angle = i < liftedBallCount ? CONFIG.initialLaunchAngle : 0;

    pendulumBalls.push({
      id: i,
      pivotX,
      pivotY,
      angle,
      velocity: 0, // angular velocity (rad/s)
      radius: CONFIG.ballRadius,
      mass: CONFIG.masses?.[i] ?? 1,
      x: pivotX + CONFIG.threadLength * Math.sin(angle),
      y: pivotY - CONFIG.threadLength * Math.cos(angle),
      held: false, // New field: default to false
    });
  }
}

/**
 * Resets all balls to hanging straight down, zero velocity.
 */
export function resetSystem() {
  pendulumBalls.forEach((ball) => {
    ball.angle = 0;
    ball.velocity = 0;
    ball.x = ball.pivotX;
    ball.y = ball.pivotY - CONFIG.threadLength;
    ball.held = false; // Ensure held state is reset
  });
}

export function updateBallMass(ballId, newMass) {
  const ball = pendulumBalls.find((b) => b.id === ballId);
  if (ball) {
    ball.mass = newMass;
  }
}