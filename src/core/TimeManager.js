import * as THREE from "three";

export class TimeManager {
  constructor() {
    this.clock = new THREE.Clock();
    this.deltaTime = 0;
  }

  update() {
    this.deltaTime = Math.min(this.clock.getDelta(), 0.1);
    return this.deltaTime;
  }
}
