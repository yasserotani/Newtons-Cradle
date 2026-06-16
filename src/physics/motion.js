/**
 * @file motion.js
 * Handles the trigonometric calculations for pendulum swings.
 */

import { balls, config } from "./state.js";

/**
 * The main loop function. The integrator (main.js) will call this every frame.
 * @param {number} dt - Delta time (time elapsed since last frame).
 */
export function updateAllPendulums(dt) {
  // TODO: Loop through 'balls' array.
  // For each ball:
  // 1. Get angular acceleration.
  // 2. Update velocity (velocity += acceleration * dt).
  // 3. Apply damping to velocity.
  // 4. Update angle (angle += velocity * dt).
  // 5. Update Cartesian coordinates (x, y) based on the new angle.
}

/**
 * Calculates how fast the angle is changing based on gravity.
 * @param {number} currentAngle
 * @returns {number} The angular acceleration.
 */
export function calculateAngularAcceleration(currentAngle) {
  // TODO: Apply the pendulum formula: -(gravity / stringLength) * Math.sin(currentAngle)
  return 0; // Replace with actual math
}

/**
 * Reduces velocity slightly to simulate air resistance.
 * @param {number} velocity
 * @returns {number} The damped velocity.
 */
export function applyDamping(velocity) {
  // TODO: Return velocity * config.damping
  return velocity;
}

/**
 * Converts the rotational angle into actual 2D screen coordinates.
 * @param {Object} ball - The ball object from the state array.
 */
export function updateCartesianCoordinates(ball) {
  // TODO: Calculate actual X and Y using trigonometry.
  // ball.x = ball.pivotX + (config.stringLength * Math.sin(ball.angle))
  // ball.y = ball.pivotY - (config.stringLength * Math.cos(ball.angle))
}
