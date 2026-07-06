// quick test to compute total energy
import { CONFIG } from "../src/constants.js";
import { initPhysicsSystem, pendulumBalls } from "../src/physics/state.js";
import { getTotalSystemEnergy } from "../src/physics/motion.js";

CONFIG.ballCount = 5;
CONFIG.ballRadius = 0.4;
CONFIG.threadLength = 2.0;
CONFIG.supportHeight = 3.0;
CONFIG.masses = [10, 10, 10, 10, 10];

initPhysicsSystem();

// apply an initial angle to first ball
pendulumBalls[0].angle = (60 * Math.PI) / 180;

const totals = getTotalSystemEnergy();
console.log("totals:", totals);
export {};
