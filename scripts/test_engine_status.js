import { CONFIG } from "../src/constants.js";
import { PhysicsEngine } from "../src/physics/PhysicsEngine.js";

const cfg = { ...CONFIG };
cfg.ballCount = 5;
cfg.masses = [10, 10, 10, 10, 10];
cfg.ballRadius = 0.4;
console.log("script start");

try {
  const engine = new PhysicsEngine(cfg);
  engine.applyInitialLaunchState(-60, 1);
  engine.infiniteMotion = true;
  engine.update(1 / 60);
  const status = engine.getStatus();
  // step multiple frames to observe energy drift
  for (let i = 0; i < 600; i++) {
    engine.update(1 / 60);
    const status = engine.getStatus();
    if (i % 60 === 0) {
      console.log(
        "frame",
        i,
        "E=",
        status.totalEnergy.toFixed(6),
        "lost=",
        status.energyTransfer.toFixed(8),
      );
    }
  }
} catch (err) {
  console.error("error running test:", err && err.stack ? err.stack : err);
}
export {};
