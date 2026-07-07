
export class Ball {
  // Initializes a new Ball instance with its physical properties and position.
  constructor(id, pivotX, pivotY, angle, velocity, radius, mass, threadLength) {
    this.id = id;
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.angle = angle;
    this.velocity = velocity;
    this.radius = radius;
    this.mass = mass;
    this.held = false;

    this.x = 0;
    this.y = 0;

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
      this.velocity = 0;
    }
  }

  // Method to set the angle and stop motion
  setAngle(angle, threadLength) {
    const MAX_DRAG_ANGLE = 1.4;
    this.angle = Math.max(
        -MAX_DRAG_ANGLE,
        Math.min(MAX_DRAG_ANGLE, angle),
    );
    this.velocity = 0;
    this.updateCartesianCoordinates(threadLength);
  }
}