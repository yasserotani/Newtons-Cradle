/**
 * @file motion.js
 * @description Handles pendulum swing math, integration, and damping.
 */
import { pendulumBalls } from './state.js';
import { PHYSICS, PENDULUM } from '../constants.js';

/**
 * Updates the physical state of all balls based on time (dt).
 */
export function updateAllPendulums(dt) {
    pendulumBalls.forEach(ball => {
        // 1. Calculate Acceleration
        const acc = calculateAngularAcceleration(ball.angle, PENDULUM.DEFAULT_LENGTH);
        
        // 2. Update Velocity
        ball.velocity += acc * dt;
        ball.velocity = applyDamping(ball.velocity);
        
        // 3. Update Angle
        ball.angle += ball.velocity * dt;
        
        // 4. Update Position
        updateCartesianCoordinates(ball, PENDULUM.DEFAULT_LENGTH);
    });
}

/**
 * Calculates angular acceleration based on the pendulum angle.
 */
export function calculateAngularAcceleration(currentAngle, stringLength) {
    // Formula: -(g / L) * sin(theta)
    return -(PHYSICS.GRAVITY / stringLength) * Math.sin(currentAngle);
}

/**
 * Reduces velocity to simulate air resistance.
 */
export function applyDamping(velocity) {
    return velocity * PHYSICS.AIR_DAMPING;
}

/**
 * Converts a ball's rotational angle into X/Y coordinates.
 */
export function updateCartesianCoordinates(ball, stringLength) {
    // x = pivotX + L * sin(theta)
    // y = pivotY - L * cos(theta)
    ball.x = ball.pivotX + (stringLength * Math.sin(ball.angle));
    ball.y = ball.pivotY - (stringLength * Math.cos(ball.angle));
}