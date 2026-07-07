
import { CONFIG, computeCradleWidth } from "../constants.js";
import { Ball } from "./Ball.js"; // Import the new Ball class

export const pendulumBalls = [];

export function initPhysicsSystem() {
  pendulumBalls.length = 0;

  const cradleWidth = computeCradleWidth(CONFIG);

  const spacing = CONFIG.ballCount > 1 ? cradleWidth / (CONFIG.ballCount - 1) : 0;

  const startX = -cradleWidth / 2;

  for (let i = 0; i < CONFIG.ballCount; i++) {
    const pivotX = startX + i * spacing;
    const pivotY = CONFIG.supportHeight;
    const angle = 0;
    const velocity = 0;
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
    pendulumBalls.push(newBall);
  }
}


export function resetSystem() {
  pendulumBalls.forEach((ball) => {
    ball.angle = 0;
    ball.velocity = 0;
    ball.updateCartesianCoordinates(CONFIG.threadLength);
    ball.held = false;
  });
}