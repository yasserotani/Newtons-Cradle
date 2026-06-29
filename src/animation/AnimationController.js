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
