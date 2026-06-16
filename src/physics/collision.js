/**
 * @file collision.js
 * Detects physical overlap and resolves 1D elastic collisions.
 */

import { balls } from "./state.js";

/**
 * Scans all adjacent balls for collisions.
 * @returns {boolean} True if an impact happened (so main.js can play a sound).
 */
export function handleAllCollisions() {
  let collisionDetected = false;

  // TODO: Loop through 'balls' and compare ball[i] with ball[i+1].
  // If checkOverlap() is true:
  // 1. Call separateBalls() to fix the clipping.
  // 2. Call swapVelocities() to transfer the energy.
  // 3. Set collisionDetected = true.

  return collisionDetected;
}

/**
 * Checks if the distance between two ball centers is less than their combined radii.
 * @param {Object} ballA
 * @param {Object} ballB
 * @returns {boolean}
 */
export function checkOverlap(ballA, ballB) {
  // TODO: Calculate horizontal distance: Math.abs(ballA.x - ballB.x)
  // Return true if distance < (ballA.radius + ballB.radius)
  return false;
}

/**
 * Instantly transfers the speed from one ball to the next (Elastic Collision).
 * @param {Object} ballA
 * @param {Object} ballB
 */
export function swapVelocities(ballA, ballB) {
  // TODO: Store ballA.velocity in a temporary variable.
  // Assign ballB.velocity to ballA.
  // Assign the temporary variable to ballB.
}

/**
 * Pushes the balls apart slightly so they don't get stuck inside each other.
 * @param {Object} ballA
 * @param {Object} ballB
 */
export function separateBalls(ballA, ballB) {
  // TODO: If they are overlapping, manually adjust their angles slightly
  // so the distance between them is exactly (radius * 2).
}
