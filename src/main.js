// src/main.js
import {
  scene,
  camera,
  renderer,
  updater,
  cradleGroup,
  PhysicsBridge,
} from "./graphics/index.js";
import { CONFIG } from "./constants.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PhysicsEngine } from "./physics/engine.js";
import { CradleBuilder } from "./graphics/builders/CradleBuilder.js";
import { CradleUpdater } from "./graphics/builders/CradleUpdater.js";
import { TimeManager } from "./core/TimeManager.js";
import { UIManager } from "./core/UIManager.js";
import { AnimationController } from "./animation/AnimationController.js";
import { StateSync } from "./animation/StateSync.js";
import { AudioManager } from "./core/AudioManager.js";

let activeCradleGroup = cradleGroup;
let activeUpdater = updater;
const physicsBridge = new PhysicsBridge(activeUpdater);
const timeManager = new TimeManager();
const audioManager = new AudioManager();

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, CONFIG.supportHeight - CONFIG.threadLength, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const gridHelper = new THREE.GridHelper(8, 16, 0x888888, 0x444444);
gridHelper.position.y = -0.2;
scene.add(gridHelper);

const physics = new PhysicsEngine(CONFIG);

function rebuildCradle() {
  if (activeCradleGroup) {
    scene.remove(activeCradleGroup);
  }

  const nextConfig = { ...physics.config };
  nextConfig.cradleWidth =
    nextConfig.cradleWidth ??
    nextConfig.ballCount * nextConfig.ballRadius * 1.7;

  const nextGroup = CradleBuilder.build(nextConfig);
  scene.add(nextGroup);
  activeCradleGroup = nextGroup;
  activeUpdater = new CradleUpdater(nextGroup);
  physicsBridge.updater = activeUpdater;
}

const params = {
  gravity: physics.config.gravity,
  restitution: physics.config.restitution,
  ballCount: physics.config.ballCount,
  ballRadius: physics.config.ballRadius,
  mass: physics.config.masses?.[0] ?? 1,
  initialLaunchAngle: physics.config.initialLaunchAngle,
  liftedBallCount: physics.config.liftedBallCount,
  reset: () => {
    physics.config.gravity = params.gravity;
    physics.config.restitution = params.restitution;
    physics.config.ballCount = params.ballCount;
    physics.config.ballRadius = params.ballRadius;
    physics.config.initialLaunchAngle = params.initialLaunchAngle;
    physics.config.liftedBallCount = params.liftedBallCount;
    physics.config.masses = Array.from(
      { length: params.ballCount },
      () => params.mass,
    );
    physics.config.cradleWidth = params.ballCount * params.ballRadius * 1.7;
    physics.gravity = params.gravity;
    physics.reset();
    rebuildCradle();
  },
};

let isPaused = false;
let animationController = null;
const uiManager = new UIManager(
  () => params.reset(),
  () => {
    isPaused = !isPaused;
    if (isPaused) animationController?.stop();
    else animationController?.start();
  },
  () => {
    const defaults = {
      gravity: CONFIG.gravity,
      restitution: CONFIG.restitution,
      ballCount: CONFIG.ballCount,
      ballRadius: CONFIG.ballRadius,
      mass: CONFIG.masses?.[0] ?? 1,
      initialLaunchAngle: CONFIG.initialLaunchAngle,
      liftedBallCount: CONFIG.liftedBallCount,
    };

    Object.assign(params, defaults);
    uiManager.setControllerValues(defaults);
    params.reset();
  },
);
uiManager.createControls(params);

const stateSync = new StateSync(physicsBridge, physics);
animationController = new AnimationController(() => {
  const dt = timeManager.update();
  stateSync.sync(dt);
  const status = physics.getStatus?.() ?? {
    velocity: 0,
    momentum: 0,
    collisions: 0,
    energyTransfer: 0,
    activeBall: 0,
    damping: 0.998,
  };
  status.gravity = physics.config.gravity;
  status.restitution = physics.config.restitution;
  status.ballCount = physics.config.ballCount;
  status.ballRadius = physics.config.ballRadius;
  status.mass = physics.config.masses?.[0] ?? 1;
  status.initialLaunchAngle = physics.config.initialLaunchAngle;
  status.liftedBallCount = physics.config.liftedBallCount;
  uiManager.updateStatus(status);
  controls.update();
  renderer.render(scene, camera);
  audioManager.playCollision();
});

rebuildCradle();
animationController.start();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.physicsBridge = physicsBridge;
window.physics = physics;
window.rebuildCradle = rebuildCradle;
