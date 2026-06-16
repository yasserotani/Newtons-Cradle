/**
 * @file state.js
 * @description Holds the physics state and initialization logic.
 */
import { CRADLE } from "../constants.js";

export const pendulumBalls = [];

export const environment = {
  gravity: 9.81,
  damping: 0.999,
};

/**
 * Initializes the physics array with ball objects.
 */
export function initPhysicsSystem() {
  pendulumBalls.length = 0; // Clear array
  for (let i = 0; i < CRADLE.NUM_BALLS; i++) {
    // Calculate X position so they are centered
    const spacing = CRADLE.BALL_RADIUS * 2 + CRADLE.BALL_SPACING;
    const xPos = (i - (CRADLE.NUM_BALLS - 1) / 2) * spacing;

    pendulumBalls.push({
      id: i,
      x: xPos,
      y: 0,
      velocity: 0,
      angle: 0,
      radius: CRADLE.BALL_RADIUS,
      mass: 1.0,
      pivotX: xPos,
      pivotY: 10,
    });
  }
}

/**
 * Resets all balls to their default resting position and zero velocity.
 */
export function resetSystem() {
  pendulumBalls.forEach((ball) => {
    ball.angle = 0;
    ball.velocity = 0;
  });
}

/**
 * Dynamically updates the mass of a ball.
 */
export function updateBallMass(ballId, newMass) {
  const ball = pendulumBalls.find((b) => b.id === ballId);
  if (ball) {
    ball.mass = newMass;
  }
}
