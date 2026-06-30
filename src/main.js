// src/main.js
import {
  scene,
  camera,
  renderer,
  CradleBuilder as GraphicsCradleBuilder, // Import as class
  CradleUpdater as GraphicsCradleUpdater, // Import as class
  PhysicsBridge,
} from "./graphics/index.js";
import { CONFIG, computeCradleWidth } from "./constants.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PhysicsEngine } from "./physics/PhysicsEngine.js";
import { CradleBuilder } from "./graphics/builders/CradleBuilder.js";
import { CradleUpdater } from "./graphics/builders/CradleUpdater.js";
import { TimeManager } from "./core/TimeManager.js";
import { UIManager } from "./core/UIManager.js";
import { AnimationController } from "./animation/AnimationController.js";
import { StateSync } from "./animation/StateSync.js";
import { AudioManager } from "./core/AudioManager.js";
import { DragController } from "./interaction/DragController.js";

let activeCradleGroup = null; // Initialize to null
let activeUpdater = null; // Initialize to null
const physicsBridge = new PhysicsBridge(activeUpdater); // Will be updated later
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
  nextConfig.cradleWidth = computeCradleWidth(nextConfig);

  // Use the imported CradleBuilder class
  const nextGroup = GraphicsCradleBuilder.build(nextConfig);
  scene.add(nextGroup);
  activeCradleGroup = nextGroup;
  // Use the imported CradleUpdater class
  activeUpdater = new GraphicsCradleUpdater(nextGroup);
  physicsBridge.updater = activeUpdater; // Update the physicsBridge's updater
}

const params = {
  gravity: physics.config.gravity,
  restitution: physics.config.restitution,
  ballCount: physics.config.ballCount,
  ballRadius: physics.config.ballRadius,
  mass: physics.config.masses?.[0] ?? 1,
  initialLaunchAngle: physics.config.initialLaunchAngle,
  liftedBallCount: physics.config.liftedBallCount,
  infiniteMotion: false,
  dragEnabled: true, // New parameter for drag control
  reset: () => {
    physics.config.gravity = params.gravity;
    physics.config.ballCount = params.ballCount;
    physics.config.ballRadius = params.ballRadius;
    physics.config.initialLaunchAngle = params.initialLaunchAngle;
    physics.config.liftedBallCount = params.liftedBallCount;
    physics.config.masses = Array.from(
        { length: params.ballCount },
        () => params.mass,
    );
    physics.config.cradleWidth = computeCradleWidth(params);

    if (params.infiniteMotion) {
      physics.config.restitution = 1.0;
    } else {
      physics.config.restitution = params.restitution;
    }

    physics.gravity = params.gravity;
    physics.infiniteMotion = params.infiniteMotion;
    physics.reset();
    rebuildCradle();
  },
};

let isPaused = false;
let animationController = null;

// Instantiate DragController early so UIManager can reference it
const dragController = new DragController(camera, renderer.domElement, () => activeCradleGroup, physics, controls);

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
        infiniteMotion: false,
        dragEnabled: true, // Default for drag control
      };

      Object.assign(params, defaults);
      uiManager.setControllerValues(defaults);
      params.reset();
    },
    dragController // Pass dragController to UIManager
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

  if (physics.getLastFrameCollisionCount() > 0) {
    audioManager.playCollision();
  }
});

rebuildCradle(); // Call rebuildCradle once after setup
animationController.start();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.physicsBridge = physicsBridge;
window.physics = physics;
window.rebuildCradle = rebuildCradle;