/**
 * @file state.js
 * Manages the shared data and initialization of the Newton's Cradle.
 */

// Array to hold the 5 ball objects
export const balls = [];

// Global physics environment variables
export const config = {
  gravity: 9.81,
  stringLength: 10,
  damping: 0.999, // Air resistance/friction multiplier
};

/**
 * Populates the 'balls' array with initial data when the simulation starts.
 * @param {number} count - Total number of balls (e.g., 5).
 * @param {number} radius - The radius of each ball.
 * @param {number} startX - The starting X coordinate for the first ball.
 */
export function initPhysicsSystem(count, radius, startX) {
  // TODO: Create a loop to push ball objects into the 'balls' array.
  // Each ball needs: id, radius, mass, x, y, angle, velocity, pivotX, pivotY.
  // Tip: Space the pivotX of each ball by exactly (radius * 2) so they touch perfectly.
}

/**
 * Instantly stops all movement and returns balls to a resting state.
 * Useful for a "Reset" button in the UI.
 */
export function resetVelocities() {
  // TODO: Loop through the 'balls' array and set angle and velocity to 0.
}
