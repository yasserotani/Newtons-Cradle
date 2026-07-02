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

// Create a deep copy of the initial CONFIG object
const ORIGINAL_CONFIG = JSON.parse(JSON.stringify(CONFIG));

let activeCradleGroup = null; // Initialize to null
let activeUpdater = null; // Initialize to null
// physicsBridge will be instantiated after rebuildCradle()
const timeManager = new TimeManager();
const audioManager = new AudioManager();

const controls = new OrbitControls(camera, renderer.domElement);
const initialCameraPosition = camera.position.clone();
const initialControlsTarget = controls.target.clone();
controls.target.set(0, CONFIG.supportHeight - CONFIG.threadLength, 0); // Reverted to original target
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
  nextConfig.spreadZ = nextConfig.cradleWidth / 5; // Make spreadZ dynamic based on cradleWidth

  // Use the imported CradleBuilder class
  const nextGroup = GraphicsCradleBuilder.build(nextConfig);
  scene.add(nextGroup);
  activeCradleGroup = nextGroup;
  // Use the imported CradleUpdater class
  activeUpdater = new GraphicsCradleUpdater(nextGroup);
  // physicsBridge.updater will be set after its instantiation
}

// Function to apply the initial angle and launch the simulation
const applyInitialMotion = () => {
  physics.applyInitialLaunchState(params.initialLaunchAngle, params.liftedBallCount);
  // Manually update the graphics to reflect the new initial state
  activeUpdater.updateBalls(physics.getPositions());
};

const params = {
  gravity: physics.config.gravity,
  restitution: physics.config.restitution,
  ballCount: physics.config.ballCount,
  ballRadius: physics.config.ballRadius,
  threadLength: physics.config.threadLength,
  supportHeight: physics.config.supportHeight,
  mass: physics.config.masses?.[0] ?? 1,
  initialLaunchAngle: physics.config.initialLaunchAngle,
  liftedBallCount: physics.config.liftedBallCount,
  infiniteMotion: false,
  dragEnabled: true, // New parameter for drag control
  reset: () => {
    physics.config.gravity = params.gravity;
    physics.config.ballCount = params.ballCount;
    physics.config.ballRadius = params.ballRadius;
    physics.config.threadLength = params.threadLength;
    physics.config.supportHeight = params.supportHeight;
    physics.config.initialLaunchAngle = params.initialLaunchAngle;
    physics.config.liftedBallCount = params.liftedBallCount;
    physics.config.masses = Array.from(
        { length: params.ballCount },
        () => params.mass,
    );
    physics.config.cradleWidth = computeCradleWidth(params);
    physics.config.spreadZ = physics.config.cradleWidth / 5; // Update spreadZ dynamically here too

    if (params.infiniteMotion) {
      physics.config.restitution = 1.0;
    } else {
      physics.config.restitution = params.restitution;
    }

    physics.gravity = params.gravity;
    physics.infiniteMotion = params.infiniteMotion;
    physics.reset(); // This will reset balls to angle 0, velocity 0
    rebuildCradle();
    // Ensure physicsBridge.updater is updated after rebuildCradle in reset
    if (window.physicsBridge) { // Check if it's already instantiated
      window.physicsBridge.updater = activeUpdater;
    }
    // After reset, ensure graphics are updated to show balls at rest
    activeUpdater.updateBalls(physics.getPositions());
  },
};

let isPaused = false;
let animationController = null;

// Call rebuildCradle once to initialize activeCradleGroup and activeUpdater
rebuildCradle();

// Instantiate physicsBridge AFTER activeUpdater is set by rebuildCradle
const physicsBridge = new PhysicsBridge(activeUpdater);

// Instantiate DragController early so UIManager can reference it
const dragController = new DragController(camera, renderer.domElement, () => activeCradleGroup, physics, controls);

// Function to reset camera view
const resetCamera = () => {
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialControlsTarget);
  controls.update();
};

const uiManager = new UIManager(
    () => params.reset(),
    () => {
      isPaused = !isPaused;
      if (isPaused) animationController?.stop();
      else animationController?.start();
    },
    () => {
      // Use ORIGINAL_CONFIG for defaults
      const defaults = {
        gravity: ORIGINAL_CONFIG.gravity,
        restitution: ORIGINAL_CONFIG.restitution,
        ballCount: ORIGINAL_CONFIG.ballCount,
        ballRadius: ORIGINAL_CONFIG.ballRadius,
        threadLength: ORIGINAL_CONFIG.threadLength,
        supportHeight: ORIGINAL_CONFIG.supportHeight,
        mass: ORIGINAL_CONFIG.masses?.[0] ?? 1,
        initialLaunchAngle: ORIGINAL_CONFIG.initialLaunchAngle,
        liftedBallCount: ORIGINAL_CONFIG.liftedBallCount,
        infiniteMotion: false,
        dragEnabled: true, // Default for drag control
      };

      Object.assign(params, defaults);
      uiManager.setControllerValues(defaults);
      params.reset();
    },
    dragController, // Pass dragController to UIManager
    resetCamera, // Pass resetCamera callback to UIManager
    applyInitialMotion // Pass the new function to UIManager
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
  };
  status.gravity = physics.config.gravity;
  status.restitution = physics.config.restitution;
  status.ballCount = physics.config.ballCount;
  status.ballRadius = physics.config.ballRadius;
  status.mass = physics.config.masses?.[0] ?? 1;
  status.initialLaunchAngle = physics.config.initialLaunchAngle;
  status.liftedBallCount = status.liftedBallCount;
  uiManager.updateStatus(status);
  controls.update();
  renderer.render(scene, camera);

  if (physics.getLastFrameCollisionCount() > 0) {
    audioManager.playCollision();
  }
});

animationController.start();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.physicsBridge = physicsBridge;
window.physics = physics;
window.rebuildCradle = rebuildCradle;