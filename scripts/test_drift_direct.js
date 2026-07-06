import { CONFIG } from "../src/constants.js";
import { initPhysicsSystem, pendulumBalls } from "../src/physics/state.js";
import {
  getTotalSystemEnergy,
  updateAllPendulums,
} from "../src/physics/motion.js";
import { handleAllCollisions } from "../src/physics/collision.js";

CONFIG.ballCount = 5;
CONFIG.masses = [10, 10, 10, 10, 10];
CONFIG.ballRadius = 0.4;
CONFIG.threadLength = 2.0;

initPhysicsSystem();
pendulumBalls[0].angle = (60 * Math.PI) / 180;

let totals = getTotalSystemEnergy();
console.log("start E=", totals.E);

for (let i = 0; i < 600; i++) {
  // step integration (before collisions)
  updateAllPendulums(1 / 60, true); // infiniteMotion true
  if (i % 60 === 0) {
    totals = getTotalSystemEnergy();
    console.log("frame", i, "after RK4 E=", totals.E.toFixed(6));
  }
  // handle collisions and then report again
  handleAllCollisions();
  if (i % 60 === 0) {
    totals = getTotalSystemEnergy();
    console.log("frame", i, "after collisions E=", totals.E.toFixed(6));
  }
}
export {};
