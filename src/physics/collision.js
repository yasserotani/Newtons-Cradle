// src/physics/collision.js
// Impulse-based collision resolution for pendulum balls constrained to
// swing arcs. Adapted from a free-3D-vector model to work with this
// project's angle/omega (angular velocity) state representation.

import { pendulumBalls } from "./state.js";
import { COLLISION, CONFIG } from "../constants.js";
import { updateCartesianCoordinates } from "./motion.js";

// ─────────────────────────────────────────────────────────────────────────
// Tunables
// ─────────────────────────────────────────────────────────────────────────

// Fraction of overlap corrected per pass (Baumgarte-style stabilization).
// Kept below 1.0 to avoid popping; small residual overlap clears over a
// couple of frames instead of snapping instantly.
const CORRECTION_PERCENT = 0.4;

// Slop so we don't fight floating-point noise at near-zero overlap.
const POSITION_SLOP = 1e-4;

// Tracks how many *actual* impulse collisions happened in the most recent
// handleAllCollisions() call (not just overlap correction). engine.js's
// getLastFrameCollisionCount() reads this via getLastCollisionCount() each
// frame for the UI counter and the audio trigger.
let lastCollisionCount = 0;

export function getLastCollisionCount() {
  return lastCollisionCount;
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Geometry (2D — balls only move in the x/y swing plane, z is always 0)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Computes the 2D collision normal and overlap depth between two balls.
 * Returns null if they aren't touching.
 */
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
    nx = 1; ny = 0; // degenerate fallback
  } else {
    nx = dx / dist;
    ny = dy / dist;
  }

  return { normal: { x: nx, y: ny }, overlap };
}

// Linear velocity vector derived from angular velocity, since
// x = pivotX + L·sin(θ), y = pivotY - L·cos(θ)
// => vx = L·ω·cos(θ), vy = L·ω·sin(θ)
function getLinearVelocity(ball, L) {
  return {
    x: ball.velocity * L * Math.cos(ball.angle),
    y: ball.velocity * L * Math.sin(ball.angle),
  };
}

// Unit tangent direction of the ball's arc at its current angle —
// used to project a 2D velocity/position delta back onto the single
// degree of freedom (angle) each ball actually has.
function getTangent(ball) {
  return { x: Math.cos(ball.angle), y: Math.sin(ball.angle) };
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Impulse-Based Resolution (mass + restitution correct for any ratio)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Resolves a collision using impulse + reduced mass, applied along the
 * collision normal, then projects the resulting velocity back onto each
 * ball's swing-tangent to get a new angular velocity (ω).
 * Returns true if an impulse was actually applied (balls were closing).
 */
function resolveImpulse(ballA, ballB, normal) {
  const L = CONFIG.threadLength;
  const e = CONFIG.restitution ?? 1.0;

  const velA = getLinearVelocity(ballA, L);
  const velB = getLinearVelocity(ballB, L);

  const vRel = (velA.x - velB.x) * normal.x + (velA.y - velB.y) * normal.y;

  // Already separating along the normal — nothing to resolve. This also
  // replaces the old isApproaching() check and avoids resting-contact jitter.
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

  // v_tangential = L·ω  =>  ω = (v · t) / L
  ballA.velocity = (newVelA.x * tA.x + newVelA.y * tA.y) / L;
  ballB.velocity = (newVelB.x * tB.x + newVelB.y * tB.y) / L;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Mass-Proportional Position Correction (angle-safe, no asin)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Pushes overlapping balls apart, distributed by inverse mass. Instead of
 * editing ball.x directly and back-deriving angle with asin() (which loses
 * sign/breaks past 90°), this nudges ball.angle by a small increment along
 * the ball's own tangent direction — keeping it exactly on its arc.
 */
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

  // Project the Cartesian correction onto each ball's tangent to get a
  // small angle delta (valid since correctionMag is tiny relative to L).
  ballA.angle += (deltaA.x * tA.x + deltaA.y * tA.y) / L;
  ballB.angle += (deltaB.x * tB.x + deltaB.y * tB.y) / L;

  updateCartesianCoordinates(ballA, L);
  updateCartesianCoordinates(ballB, L);
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Public Entry Point — same signature as before, called every substep
//    by engine.js's own 120Hz loop. Do NOT add an internal SUB_STEPS loop
//    here — engine.js already substeps integration + collisions together.
// ─────────────────────────────────────────────────────────────────────────

export function handleAllCollisions() {
  lastCollisionCount = 0;

  for (let i = 0; i < pendulumBalls.length - 1; i++) {
    for (let j = i + 1; j < pendulumBalls.length; j++) {
      const ballA = pendulumBalls[i];
      const ballB = pendulumBalls[j];

      const geometry = getCollisionGeometry(ballA, ballB);
      if (!geometry) continue;

      const applied = resolveImpulse(ballA, ballB, geometry.normal);
      correctPositions(ballA, ballB, geometry.normal, geometry.overlap);

      if (applied) lastCollisionCount += 1;
    }
  }
}