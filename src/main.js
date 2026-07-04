// src/main.js
import {
  scene,
  camera,
  renderer,
  CradleBuilder as GraphicsCradleBuilder,
  CradleUpdater as GraphicsCradleUpdater,
  PhysicsBridge,
} from "./graphics/index.js";
import { CONFIG, computeCradleWidth } from "./constants.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PhysicsEngine } from "./physics/PhysicsEngine.js";
import { TimeManager } from "./core/TimeManager.js";
import { UIManager } from "./core/UIManager.js";
import { AnimationController } from "./animation/AnimationController.js";
import { StateSync } from "./animation/StateSync.js"; // Corrected import path
import { AudioManager } from "./core/AudioManager.js";
import { DragController } from "./interaction/DragController.js";
import { KeyboardControls } from "./interaction/KeyboardControls.js"; // New import

// Deep copy of the initial CONFIG, taken before anything can mutate it —
// this is the single source of truth for what "Reset Values" restores to.
const ORIGINAL_CONFIG = JSON.parse(JSON.stringify(CONFIG));

let activeCradleGroup = null;
let activeUpdater = null;
const timeManager = new TimeManager();
const audioManager = new AudioManager();

const controls = new OrbitControls(camera, renderer.domElement);
const initialCameraPosition = camera.position.clone();
const initialControlsTarget = controls.target.clone();
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
  nextConfig.spreadZ = nextConfig.cradleWidth / 5;

  const nextGroup = GraphicsCradleBuilder.build(nextConfig);
  scene.add(nextGroup);
  activeCradleGroup = nextGroup;
  activeUpdater = new GraphicsCradleUpdater(nextGroup);
}

// Applies the initial angle and launches the simulation.
const applyInitialMotion = () => {
  physics.applyInitialLaunchState(params.initialLaunchAngle, params.liftedBallCount);
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
  dragEnabled: true,
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
    physics.config.spreadZ = physics.config.cradleWidth / 5;

    if (params.infiniteMotion) {
      physics.config.restitution = 1.0;
    } else {
      physics.config.restitution = params.restitution;
    }

    physics.gravity = params.gravity;
    physics.infiniteMotion = params.infiniteMotion;
    physics.reset(); // resets balls to angle 0, velocity 0
    rebuildCradle();
    if (window.physicsBridge) {
      window.physicsBridge.updater = activeUpdater;
    }
    activeUpdater.updateBalls(physics.getPositions());
  },
};

let isPaused = false;
let animationController = null;

rebuildCradle();

const physicsBridge = new PhysicsBridge(activeUpdater);

const dragController = new DragController(camera, renderer.domElement, () => activeCradleGroup, physics, controls);

const resetCamera = () => {
  camera.position.copy(initialCameraPosition);
  controls.target.copy(initialControlsTarget);
  controls.update();
};

const onPauseToggle = () => {
  isPaused = !isPaused;
  if (isPaused) animationController?.stop();
  else animationController?.start();
  // Update the pause button text in the UI
  uiManager.pauseButton.textContent = isPaused ? "Resume" : "Pause";
};

const uiManager = new UIManager(
    () => params.reset(),
    onPauseToggle, // Pass the shared onPauseToggle function
    () => {
      // Restore every slider to ORIGINAL_CONFIG's values.
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
        dragEnabled: true,
      };

      Object.assign(params, defaults);
      uiManager.setControllerValues(defaults);
      params.reset();

      // FIX: params.reset() alone only leaves every ball hanging straight
      // down at rest — it never re-applies the default launch pose. Since
      // the cradle looks identical at rest no matter what the underlying
      // values are, this made "Reset Values" look like it did nothing
      // even when every slider had, in fact, been restored correctly.
      // Re-applying the default launch state here makes the reset
      // visually obvious.
      applyInitialMotion();
    },
    dragController,
    resetCamera,
    applyInitialMotion,
);
uiManager.createControls(params);

// Instantiate KeyboardControls
new KeyboardControls(onPauseToggle);

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
    ballVelocities: [],
    ballAngles: [], // Ensure ballAngles is initialized
  };
  status.gravity = physics.config.gravity;
  status.restitution = physics.config.restitution;
  status.ballCount = physics.config.ballCount;
  status.ballRadius = physics.config.ballRadius;
  status.mass = physics.config.masses?.[0] ?? 1;
  status.initialLaunchAngle = physics.config.initialLaunchAngle;
  status.liftedBallCount = physics.config.liftedBallCount; // FIX: was self-assigned (status.liftedBallCount = status.liftedBallCount), a no-op that always showed undefined
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