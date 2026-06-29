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
