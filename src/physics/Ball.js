// src/physics/Ball.js

export class Ball {
  // Initializes a new Ball instance with its physical properties and position.
  constructor(id, pivotX, pivotY, angle, velocity, radius, mass, threadLength) {
    this.id = id;
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.angle = angle; // angular position (radians)
    this.velocity = velocity; // angular velocity (rad/s)
    this.radius = radius;
    this.mass = mass;
    this.held = false;

    // Cartesian coordinates, will be updated by updateCartesianCoordinates
    this.x = 0;
    this.y = 0;

    // Initial update of Cartesian coordinates
    this.updateCartesianCoordinates(threadLength);
  }

  // Method to update Cartesian coordinates based on angle
  updateCartesianCoordinates(threadLength) {
    this.x = this.pivotX + threadLength * Math.sin(this.angle);
    this.y = this.pivotY - threadLength * Math.cos(this.angle);
  }

  // Method to set the held state
  setHeld(isHeld) {
    this.held = isHeld;
    if (isHeld) {
      this.velocity = 0; // Stop motion when held
    }
  }

  // Method to set the angle and stop motion
  setAngle(angle, threadLength) {
    // Clamp angle to a reasonable range to prevent visual glitches
    const MAX_DRAG_ANGLE = 1.4; // Approximately 80 degrees
    this.angle = Math.max(
        -MAX_DRAG_ANGLE,
        Math.min(MAX_DRAG_ANGLE, angle),
    );
    this.velocity = 0; // Held ball has no velocity
    this.updateCartesianCoordinates(threadLength);
  }
}