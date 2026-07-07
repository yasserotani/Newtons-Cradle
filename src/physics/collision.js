
import { pendulumBalls } from "./state.js";
import { COLLISION, CONFIG } from "../constants.js";

const CORRECTION_PERCENT = 0.2;
const POSITION_SLOP = 0.01;

let lastCollisionCount = 0;

export function getLastCollisionCount() {
  return lastCollisionCount;
}

function getCollisionGeometry(ballA, ballB) {
  const dx = ballB.x - ballA.x;
  const dy = ballB.y - ballA.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const overlap = ballA.radius + ballB.radius - dist;

  if (overlap <= COLLISION.SEPARATION_EPSILON) {
    return null;
  }

  let nx, ny;
  if (dist < 1e-10) {
    nx = 1; ny = 0;
  } else {
    nx = dx / dist;
    ny = dy / dist;
  }

  return { normal: { x: nx, y: ny }, overlap };
}

function getLinearVelocity(ball, L) {
  return {
    x: ball.velocity * L * Math.cos(ball.angle),
    y: ball.velocity * L * Math.sin(ball.angle),
  };
}

function getTangent(ball) {
  return { x: Math.cos(ball.angle), y: Math.sin(ball.angle) };
}

function resolveImpulse(ballA, ballB, normal) {
  const L = CONFIG.threadLength;
  const e = CONFIG.restitution ?? 1.0;

  const velA = getLinearVelocity(ballA, L);
  const velB = getLinearVelocity(ballB, L);

  const vRel = (velA.x - velB.x) * normal.x + (velA.y - velB.y) * normal.y;

  if (vRel <= 0) return false;

  const m1 = ballA.mass || 1;
  const m2 = ballB.mass || 1;
  const invM1 = 1 / m1;
  const invM2 = 1 / m2;

  const j = (-(1 + e) * vRel) / (invM1 + invM2);
  const jx = j * normal.x;
  const jy = j * normal.y;

  const newVelA = { x: velA.x + jx * invM1, y: velA.y + jy * invM1 };
  const newVelB = { x: velB.x - jx * invM2, y: velB.y - jy * invM2 };

  const tA = getTangent(ballA);
  const tB = getTangent(ballB);

  ballA.velocity = (newVelA.x * tA.x + newVelA.y * tA.y) / L;
  ballB.velocity = (newVelB.x * tB.x + newVelB.y * tB.y) / L;

  return true;
}

function correctPositions(ballA, ballB, normal, overlap) {
  const L = CONFIG.threadLength;
  const m1 = ballA.mass || 1;
  const m2 = ballB.mass || 1;
  const invM1 = 1 / m1;
  const invM2 = 1 / m2;
  const totalInv = invM1 + invM2;

  const correctionMag = Math.max(overlap - POSITION_SLOP, 0) * CORRECTION_PERCENT;
  const ratio1 = invM1 / totalInv;
  const ratio2 = invM2 / totalInv;

  const deltaA = { x: -normal.x * correctionMag * ratio1, y: -normal.y * correctionMag * ratio1 };
  const deltaB = { x: normal.x * correctionMag * ratio2, y: normal.y * correctionMag * ratio2 };

  const tA = getTangent(ballA);
  const tB = getTangent(ballB);

  ballA.angle += (deltaA.x * tA.x + deltaA.y * tA.y) / L;
  ballB.angle += (deltaB.x * tB.x + deltaB.y * tB.y) / L;

  ballA.updateCartesianCoordinates(L);
  ballB.updateCartesianCoordinates(L);
}


export function handleAllCollisions() {
  lastCollisionCount = 0;
  const collidedThisFrame = new Set(); // Track unique balls

  for (let iter = 0; iter < COLLISION.SOLVER_ITERATIONS; iter++) {
    let anyImpulseThisIteration = false;

    for (let i = 0; i < pendulumBalls.length - 1; i++) {
      for (let j = i + 1; j < pendulumBalls.length; j++) {
        const ballA = pendulumBalls[i];
        const ballB = pendulumBalls[j];

        const geometry = getCollisionGeometry(ballA, ballB);
        if (!geometry) continue;

        const applied = resolveImpulse(ballA, ballB, geometry.normal);
        correctPositions(ballA, ballB, geometry.normal, geometry.overlap);

        if (applied) {
          anyImpulseThisIteration = true;
          if (!collidedThisFrame.has(ballA.id) || !collidedThisFrame.has(ballB.id)) {
            lastCollisionCount += 1;
            collidedThisFrame.add(ballA.id);
            collidedThisFrame.add(ballB.id);
          }
        }
      }
    }
    if (!anyImpulseThisIteration) break;
  }
}