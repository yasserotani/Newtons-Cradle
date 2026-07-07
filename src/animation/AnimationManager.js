export class StateSync {
  constructor(physicsBridge, physics) {
    this.physicsBridge = physicsBridge;
    this.physics = physics;
  }

  sync(dt) {
    this.physics.update(dt);
    const positions = this.physics.getPositions();
    this.physicsBridge.updateBalls(positions);
  }
}

export class AnimationController {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.running = true;
  }

  start() {
    this.running = true;
    this.tick();
  }

  stop() {
    this.running = false;
  }

  tick() {
    if (!this.running) return;
    this.onFrame();
    requestAnimationFrame(() => this.tick());
  }
}