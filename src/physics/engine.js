// src/physics/engine.js
export class PhysicsEngine {
  constructor(config) {
    this.config = config;
    this.gravity = config.gravity ?? 9.81;
    this.balls = [];
    this.spacing = this.computeSpacing();
    this.contactDistance = this.computeContactDistance();
    this.collisionCount = 0;
    this.energyTransfer = 0;

    this.reset();
  }

  computeSpacing() {
    const ballCount = Math.max(2, this.config.ballCount ?? 2);
    const effectiveWidth =
      this.config.cradleWidth ??
      ballCount * (this.config.ballRadius ?? 0.4) * 1.7;
    return effectiveWidth / Math.max(ballCount - 1, 1);
  }

  computeContactDistance() {
    return (this.config.ballRadius ?? 0.4) * 2;
  }

  reset() {
    this.gravity = this.config.gravity ?? 9.81;
    this.spacing = this.computeSpacing();
    this.contactDistance = this.computeContactDistance();

    const startX =
      -(
        this.config.cradleWidth ??
        this.spacing * Math.max((this.config.ballCount ?? 2) - 1, 1)
      ) / 2;
    const launchAngle = this.config.initialLaunchAngle ?? -0.7;
    const liftedBallCount = Math.max(
      1,
      Math.min(this.config.ballCount ?? 2, this.config.liftedBallCount ?? 1),
    );

    this.balls = [];

    for (let i = 0; i < this.config.ballCount; i += 1) {
      this.balls.push({
        pivotX: startX + i * this.spacing,
        pivotY: this.config.supportHeight,
        angle: i < liftedBallCount ? launchAngle : 0,
        angularVelocity: 0,
        angularAcceleration: 0,
        mass: this.config.masses?.[i] ?? 1,
      });
    }
  }

  setInitialState({ angle, liftedBallCount } = {}) {
    if (typeof angle === "number") {
      this.config.initialLaunchAngle = angle;
    }

    if (typeof liftedBallCount === "number") {
      this.config.liftedBallCount = Math.max(
        1,
        Math.min(this.config.ballCount ?? 2, liftedBallCount),
      );
    }

    this.reset();
  }

  update(dt) {
    const safeDt = Math.min(Math.max(dt, 0), 0.03);
    const substeps = Math.max(1, Math.ceil(safeDt / (1 / 120)));
    const stepDt = safeDt / substeps;

    for (let step = 0; step < substeps; step += 1) {
      this.simulateStep(stepDt);
    }
  }

  simulateStep(dt) {
    const L = this.config.threadLength;
    const damping = 0.998;
    const restitution = this.config.restitution ?? 1.0;
    const previousPositions = [];

    for (let i = 0; i < this.balls.length; i += 1) {
      const ball = this.balls[i];
      previousPositions.push(ball.pivotX + Math.sin(ball.angle) * L);
    }

    for (let i = 0; i < this.balls.length; i += 1) {
      const ball = this.balls[i];
      const mass = ball.mass || 1;
      ball.angularAcceleration = -(this.gravity / L) * Math.sin(ball.angle);
      ball.angularVelocity += ball.angularAcceleration * dt;
      ball.angularVelocity *= damping;
      ball.angle += ball.angularVelocity * dt;

      if (Math.abs(ball.angle) < 1e-5) {
        ball.angularVelocity *= 0.999;
      }
    }

    let collisionOccurred = true;
    let loops = 0;
    this.collisionCount = 0;
    this.energyTransfer = 0;

    while (collisionOccurred && loops < 8) {
      collisionOccurred = false;

      for (let i = 0; i < this.balls.length - 1; i += 1) {
        const currentBall = this.balls[i];
        const nextBall = this.balls[i + 1];

        const currentX = currentBall.pivotX + Math.sin(currentBall.angle) * L;
        const nextX = nextBall.pivotX + Math.sin(nextBall.angle) * L;
        const centerDistance = nextX - currentX;
        const previousCenterDistance =
          previousPositions[i + 1] - previousPositions[i];
        const isApproaching =
          currentBall.angularVelocity > nextBall.angularVelocity;
        const isInContact =
          centerDistance <= this.contactDistance + 0.001 &&
          previousCenterDistance >= centerDistance;

        if (isInContact && isApproaching) {
          const m1 = currentBall.mass || 1;
          const m2 = nextBall.mass || 1;
          const v1 = currentBall.angularVelocity;
          const v2 = nextBall.angularVelocity;
          const newV1 = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
          const newV2 = (2 * m1 * v1 + (m2 - m1) * v2) / (m1 + m2);
          const previousVelocity = currentBall.angularVelocity;
          currentBall.angularVelocity = newV1 * restitution;
          nextBall.angularVelocity = newV2 * restitution;
          this.collisionCount += 1;
          this.energyTransfer += Math.abs(
            previousVelocity - currentBall.angularVelocity,
          );
          collisionOccurred = true;
        }
      }

      loops += 1;
    }
  }

  getStatus() {
    const activeBall = this.balls.findIndex(
      (ball) => Math.abs(ball.angularVelocity) > 0.001,
    );
    const velocity = this.balls.reduce(
      (sum, ball) => sum + Math.abs(ball.angularVelocity),
      0,
    );
    const momentum = this.balls.reduce(
      (sum, ball) => sum + Math.abs(ball.angularVelocity) * (ball.mass || 1),
      0,
    );
    const averageAngle =
      this.balls.reduce((sum, ball) => sum + ball.angle, 0) / this.balls.length;
    const averageAngularVelocity =
      this.balls.reduce((sum, ball) => sum + ball.angularVelocity, 0) /
      this.balls.length;

    return {
      velocity,
      momentum,
      collisions: this.collisionCount,
      energyTransfer: this.energyTransfer,
      activeBall: activeBall >= 0 ? activeBall + 1 : 0,
      damping: 0.998,
      gravity: this.gravity,
      restitution: this.config.restitution ?? 1.0,
      ballCount: this.config.ballCount,
      ballRadius: this.config.ballRadius,
      mass: this.balls[0]?.mass ?? 1,
      initialLaunchAngle: this.config.initialLaunchAngle,
      liftedBallCount: this.config.liftedBallCount,
      averageAngle,
      averageAngularVelocity,
      contactDistance: this.contactDistance,
    };
  }

  getPositions() {
    const L = this.config.threadLength;
    const positions = [];

    for (let i = 0; i < this.balls.length; i += 1) {
      const ball = this.balls[i];
      const currentX = ball.pivotX + L * Math.sin(ball.angle);
      const currentY = ball.pivotY - L * Math.cos(ball.angle);
      positions.push({ x: currentX, y: currentY, z: 0 });
    }

    return positions;
  }
}
