/**
 * @file collision.js
 * @description Detects collisions and handles energy transfer.
 */
import { pendulumBalls } from "./state.js";
import { COLLISION } from "../constants.js";

/**
 * Main loop to check for collisions between adjacent balls.
 */
export function handleAllCollisions() {
  for (let i = 0; i < pendulumBalls.length - 1; i++) {
    const ballA = pendulumBalls[i];
    const ballB = pendulumBalls[i + 1];

    if (checkOverlap(ballA, ballB)) {
      separateBalls(ballA, ballB);
      swapVelocities(ballA, ballB);
    }
  }
}

/**
 * Checks if the distance between two balls is less than their combined radii.
 */
export function checkOverlap(ballA, ballB) {
  const dist = Math.abs(ballA.x - ballB.x);
  return dist < ballA.radius + ballB.radius - COLLISION.SEPARATION_EPSILON;
}

/**
 * Swaps velocity between two balls to conserve momentum.
 */
export function swapVelocities(ballA, ballB) {
  const tempVelocity = ballA.velocity;
  ballA.velocity = ballB.velocity;
  ballB.velocity = tempVelocity;
}

/**
 * Prevents balls from getting stuck inside each other.
 */
export function separateBalls(ballA, ballB) {
  const dist = Math.abs(ballA.x - ballB.x);
  const overlap = ballA.radius + ballB.radius - dist;

  // Push them apart by half the overlap each
  if (ballA.x < ballB.x) {
    ballA.x -= overlap / 2;
    ballB.x += overlap / 2;
  } else {
    ballA.x += overlap / 2;
    ballB.x -= overlap / 2;
  }
}
