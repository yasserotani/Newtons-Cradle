# Project Structure Report: Newton's Cradle Simulation

## 1. Toolchain & Architecture Overview

This project implements a Newton's Cradle simulation using modern web technologies, focusing on a clear separation of concerns between physics, graphics, and user interface logic.

**Libraries and Frameworks:**
*   **Three.js**: A JavaScript 3D library used for rendering the 3D scene, including the cradle, balls, threads, and environment.
*   **lil-gui**: A lightweight graphical user interface library used for creating interactive controls for simulation parameters.
*   **Chart.js**: A flexible JavaScript charting library used to visualize real-time physics metrics such as velocity, momentum, and energy.
*   **Vite**: A fast build tool for modern web projects, used for development and bundling.

**Physics Engine:**
The physics simulation is entirely **hand-rolled**, meaning there is no external physics engine library used. All physics calculations, including motion integration, collision detection, and resolution, are implemented custom within the `src/physics` module.

**Overall Separation of Concerns:**
The project architecture is designed with distinct layers:

*   **Physics/Simulation Logic (`src/physics`)**: This module is responsible for all numerical calculations related to the pendulum motion, collision detection, and resolution. It maintains the canonical state of the physical system (ball positions, velocities, masses, etc.) and is independent of any rendering concerns.
*   **Rendering/Graphics Logic (`src/graphics`)**: This module handles the 3D visualization of the simulation using Three.js. It constructs the 3D models of the cradle, balls, and threads, manages the scene, camera, lighting, and updates the visual representation based on data received from the physics layer.
*   **UI/Interaction Logic (`src/core`, `src/interaction`)**: This layer manages user input (keyboard, mouse drag), displays simulation parameters and real-time status, and provides controls for adjusting various aspects of the simulation. It acts as an intermediary, translating user actions into changes in physics parameters or graphics settings.
*   **Core Utilities (`src/core`)**: Contains foundational services like time management, audio playback, and the main UI manager.
*   **Animation/Synchronization (`src/animation`)**: Bridges the physics and graphics layers, ensuring that the visual representation accurately reflects the physics state each frame.

This modular approach enhances maintainability, allows for independent development of different aspects, and facilitates potential future changes (e.g., swapping out the rendering engine or physics implementation).

## 2. Module Breakdown

This section details the purpose and dependencies of each significant file and folder within the `src` directory.

### Core Utilities (`src/core`)

*   **`src/core/UIManager.js`**:
    *   **Responsibility**: Manages the graphical user interface (GUI) using `lil-gui` for simulation parameters, displays real-time physics status (velocity, momentum, energy, ball activity) using `Chart.js`, and handles UI-triggered actions like reset, pause, and camera reset.
    *   **Dependencies**: Depends on `lil-gui`, `chart.js`, `src/core/AudioManager.js`, `src/interaction/DragController.js`. It interacts with `PhysicsEngine` (via `params` object) and `AnimationController` (via `onPauseToggle`).
*   **`src/core/TimeManager.js`**:
    *   **Responsibility**: Manages the time delta between animation frames, providing a consistent `dt` for physics calculations.
    *   **Dependencies**: Depends on `three`.
*   **`src/core/AudioManager.js`**:
    *   **Responsibility**: Handles audio playback, specifically playing a collision sound effect. It provides methods to enable/disable sound.
    *   **Dependencies**: None directly, uses browser's `AudioContext`.

### Physics Simulation (`src/physics`)

*   **`src/physics/Ball.js`**:
    *   **Responsibility**: Defines the `Ball` class, representing a single pendulum ball with its physical properties (id, pivot, angle, velocity, radius, mass, thread length) and methods to update its Cartesian coordinates and manage its `held` state.
    *   **Dependencies**: None directly.
*   **`src/physics/state.js`**:
    *   **Responsibility**: Manages the global state of the physics system, primarily the `pendulumBalls` array. It provides functions to initialize the system (`initPhysicsSystem`) and reset all balls to their resting state (`resetSystem`).
    *   **Dependencies**: Depends on `src/constants.js` and `src/physics/Ball.js`.
*   **`src/physics/motion.js`**:
    *   **Responsibility**: Implements the core pendulum physics, including Runge-Kutta 4th order (RK4) integration for angular motion, calculation of angular acceleration (considering gravity, viscous damping, and air drag), and energy calculations (kinetic, potential, total).
    *   **Dependencies**: Depends on `src/physics/state.js` and `src/constants.js`.
*   **`src/physics/collision.js`**:
    *   **Responsibility**: Handles collision detection and resolution between pendulum balls using an impulse-based method. It iteratively resolves collisions to ensure stability and accurate momentum transfer.
    *   **Dependencies**: Depends on `src/physics/state.js` and `src/constants.js`.
*   **`src/physics/PhysicsEngine.js`**:
    *   **Responsibility**: Acts as an orchestrator for the physics module. It initializes and resets the physics system, updates the simulation step-by-step (calling `motion.js` and `collision.js`), and provides an API for `main.js` to interact with the physics state (e.g., `getPositions`, `getStatus`, `setBallHeld`, `applyInitialLaunchState`).
    *   **Dependencies**: Depends on `src/physics/state.js`, `src/physics/motion.js`, `src/physics/collision.js`, and `src/constants.js`.

### Graphics Rendering (`src/graphics`)

*   **`src/graphics/index.js`**:
    *   **Responsibility**: The entry point for the graphics module, setting up the Three.js scene, camera, renderer, and lights. It exports key Three.js objects and graphics-related builders/updaters for use by `main.js`.
    *   **Dependencies**: Depends on `src/graphics/scene/SceneManager.js`, `src/graphics/scene/LightsManager.js`, `src/graphics/builders/CradleBuilder.js`, `src/graphics/builders/CradleUpdater.js`, `src/graphics/PhysicsBridge.js`, and `src/constants.js`.
*   **`src/graphics/scene/SceneManager.js`**:
    *   **Responsibility**: Initializes and manages the Three.js scene, camera, and WebGL renderer. It also sets up the environment map and handles window resizing.
    *   **Dependencies**: Depends on `three` and `src/graphics/environment/environment.js`.
*   **`src/graphics/scene/LightsManager.js`**:
    *   **Responsibility**: Configures and adds various types of lights (ambient, hemisphere, directional, point) to the Three.js scene to illuminate the objects.
    *   **Dependencies**: Depends on `three`.
*   **`src/graphics/objects/Ball.js`**: (Content not provided, but inferred)
    *   **Responsibility**: Likely defines the 3D mesh representation of a single ball.
    *   **Dependencies**: Likely depends on `three`.
*   **`src/graphics/objects/Thread.js`**: (Content not provided, but inferred)
    *   **Responsibility**: Likely defines the 3D line representation of a single thread.
    *   **Dependencies**: Likely depends on `three`.
*   **`src/graphics/builders/CradleBuilder.js`**:
    *   **Responsibility**: Constructs the entire 3D model of the Newton's Cradle (balls, threads, support structure) based on configuration parameters. It returns a Three.js `Group` containing all these objects.
    *   **Dependencies**: Depends on `three` and `src/graphics/materials/CradleMaterials.js`.
*   **`src/graphics/builders/CradleUpdater.js`**:
    *   **Responsibility**: Updates the positions of the 3D ball and thread meshes based on the Cartesian coordinates provided by the physics engine.
    *   **Dependencies**: Depends on `three`.
*   **`src/graphics/materials/CradleMaterials.js`**:
    *   **Responsibility**: Provides factory functions for creating various Three.js materials used in the cradle (balls, threads, support). It also contains `createCradleArm` which builds the complex support structure geometry.
    *   **Dependencies**: Depends on `three`.
*   **`src/graphics/environment/environment.js`**:
    *   **Responsibility**: Sets up the environment map for the Three.js scene, loading an EXR image for realistic reflections and global illumination.
    *   **Dependencies**: Depends on `three`, `three/examples/jsm/loaders/EXRLoader.js`, and `three/examples/jsm/loaders/PMREMGenerator.js`.
*   **`src/graphics/PhysicsBridge.js`**:
    *   **Responsibility**: Acts as the official interface between the physics engine and the graphics updater. It receives physics positions and passes them to the `CradleUpdater` to update the 3D scene.
    *   **Dependencies**: Depends on `src/graphics/builders/CradleUpdater.js` (via constructor).

### Animation & Synchronization (`src/animation`)

*   **`src/animation/StateSync.js`**:
    *   **Responsibility**: Orchestrates the synchronization between the physics engine and the graphics bridge. In each animation frame, it tells the physics engine to update and then passes the new positions to the graphics bridge.
    *   **Dependencies**: Depends on `src/graphics/PhysicsBridge.js` and `src/physics/PhysicsEngine.js`.
*   **`src/animation/AnimationController.js`**:
    *   **Responsibility**: Manages the main animation loop using `requestAnimationFrame`. It calls a provided `onFrame` callback repeatedly and allows starting/stopping the animation.
    *   **Dependencies**: None directly, uses browser's `requestAnimationFrame`.

### Interaction (`src/interaction`)

*   **`src/interaction/DragController.js`**:
    *   **Responsibility**: Handles user interaction for dragging individual balls in the 3D scene. It uses Three.js raycasting to detect ball clicks and translates drag movements into angular changes for the physics engine. It also temporarily disables OrbitControls during a drag.
    *   **Dependencies**: Depends on `three`, `src/physics/PhysicsEngine.js` (via `setBallHeld`, `setBallAngle`), and `OrbitControls`.
*   **`src/interaction/KeyboardControls.js`**:
    *   **Responsibility**: Handles keyboard input, specifically the spacebar to toggle the simulation pause state.
    *   **Dependencies**: Interacts with `UIManager` (via `onPauseToggle`).

### Root Files

*   **`src/main.js`**:
    *   **Responsibility**: The primary entry point of the application. It initializes all major components (Three.js scene, physics engine, UI manager, animation controller, interaction controllers), sets up the initial cradle, and defines the main animation loop callback.
    *   **Dependencies**: Depends on almost all other modules: `src/graphics/index.js`, `src/constants.js`, `three`, `three/addons/controls/OrbitControls.js`, `src/physics/PhysicsEngine.js`, `src/core/TimeManager.js`, `src/core/UIManager.js`, `src/animation/AnimationController.js`, `src/animation/StateSync.js`, `src/core/AudioManager.js`, `src/interaction/DragController.js`, `src/interaction/KeyboardControls.js`.
*   **`src/constants.js`**:
    *   **Responsibility**: Defines global constants and configuration parameters for both physics and graphics, such as ball count, radius, gravity, restitution, and collision solver iterations. It also includes utility functions like `computeCradleWidth`.
    *   **Dependencies**: None directly, but is depended upon by many other modules.

## 3. Main Functions/Classes

This section outlines key functions and classes that play a meaningful role in the simulation.

### `src/physics/Ball.js`

*   **Class**: `Ball`
    *   **Constructor Signature**: `constructor(id, pivotX, pivotY, angle, velocity, radius, mass, threadLength)`
    *   **Description**: Initializes a new ball with its unique ID, pivot point coordinates, initial angular position (`angle` in radians), angular velocity (`velocity` in rad/s), physical radius, mass, and thread length. It also initializes Cartesian coordinates which are derived from the angular state.
    *   **Method**: `updateCartesianCoordinates(threadLength)`
        *   **Signature**: `updateCartesianCoordinates(threadLength)`
        *   **Description**: Updates the ball's `x` and `y` Cartesian coordinates based on its current `angle`, `pivotX`, `pivotY`, and `threadLength`.
        *   **Algorithm**:
            `this.x = this.pivotX + threadLength * Math.sin(this.angle);`
            `this.y = this.pivotY - threadLength * Math.cos(this.angle);`
    *   **Method**: `setHeld(isHeld)`
        *   **Signature**: `setHeld(isHeld)`
        *   **Description**: Sets the `held` state of the ball. If `true`, its velocity is immediately set to 0, preventing physics integration from affecting it.
    *   **Method**: `setAngle(angle, threadLength)`
        *   **Signature**: `setAngle(angle, threadLength)`
        *   **Description**: Directly sets the ball's angular position (`angle` in radians), clamps it to a reasonable range (approx. +/- 80 degrees), sets its velocity to 0, and updates its Cartesian coordinates. Used for initial setup and drag interaction.

### `src/physics/state.js`

*   **Function**: `initPhysicsSystem()`
    *   **Signature**: `initPhysicsSystem()`
    *   **Description**: Clears the `pendulumBalls` array and repopulates it with new `Ball` instances based on the current `CONFIG` (ball count, radius, thread length, masses, etc.). It calculates precise pivot points to ensure balls are flush at rest. Balls are initialized at `angle = 0` and `velocity = 0`.
*   **Function**: `resetSystem()`
    *   **Signature**: `resetSystem()`
    *   **Description**: Iterates through all existing `pendulumBalls`, setting their `angle` to 0, `velocity` to 0, `held` state to `false`, and updating their Cartesian coordinates to reflect the resting position.

### `src/physics/motion.js`

*   **Function**: `calculateCrossSection(radius)`
    *   **Signature**: `calculateCrossSection(radius)`
    *   **Description**: Computes the circular cross-sectional area of a ball, used in air drag calculations.
    *   **Formula**: `π * radius²`
*   **Function**: `calculateAngularAcceleration(angle, omega, L, mass, radius, infiniteMotion)`
    *   **Signature**: `calculateAngularAcceleration(angle, omega, L, mass, radius, infiniteMotion)`
    *   **Description**: Calculates the instantaneous angular acceleration of a pendulum ball. It sums contributions from gravity, viscous damping, and air drag. If `infiniteMotion` is true, damping and air drag terms are zeroed out.
    *   **Algorithm**:
        *   `gravityTerm = -(g / L) * sin(angle)`
        *   `viscousTerm = -(PHYSICS.VISCOUS_K / mass) * omega`
        *   `airDragTerm = -((RHO_AIR * CD * A * L) / (2 * mass)) * omega * |omega|`
        *   `totalAcceleration = gravityTerm + viscousTerm + airDragTerm`
        *   Where `g` is gravity, `L` is thread length, `A` is cross-sectional area, `RHO_AIR` is air density, `CD` is drag coefficient, `PHYSICS.VISCOUS_K` is viscous damping constant.
*   **Function**: `calculateKineticEnergy(omega, L, mass)`
    *   **Signature**: `calculateKineticEnergy(omega, L, mass)`
    *   **Description**: Calculates the kinetic energy of a single ball.
    *   **Formula**: `½ * mass * (omega * L)²`
*   **Function**: `calculatePotentialEnergy(angle, L, mass)`
    *   **Signature**: `calculatePotentialEnergy(angle, L, mass)`
    *   **Description**: Calculates the gravitational potential energy of a single ball relative to its lowest point.
    *   **Formula**: `mass * g * L * (1 - cos(angle))`
*   **Function**: `calculateMechanicalEnergy(angle, omega, L, mass)`
    *   **Signature**: `calculateMechanicalEnergy(angle, omega, L, mass)`
    *   **Description**: Calculates and returns the kinetic, potential, and total mechanical energy for a single ball.
*   **Function**: `getTotalSystemEnergy()`
    *   **Signature**: `getTotalSystemEnergy()`
    *   **Description**: Iterates through all `pendulumBalls` (excluding held ones) and sums their individual kinetic, potential, and total mechanical energies to provide the total system energy.
*   **Function**: `updateAllPendulums(dt, infiniteMotion)`
    *   **Signature**: `updateAllPendulums(dt, infiniteMotion)`
    *   **Description**: The main integration function. For each ball not currently `held`, it performs a single step of RK4 integration using `rk4Step` to update its `angle` and `velocity`. It then updates the ball's Cartesian coordinates and calculates its individual energy components.

### `src/physics/collision.js`

*   **Function**: `getCollisionGeometry(ballA, ballB)`
    *   **Signature**: `getCollisionGeometry(ballA, ballB)`
    *   **Description**: Detects if two balls are overlapping and, if so, calculates the collision normal vector and the depth of overlap.
*   **Function**: `resolveImpulse(ballA, ballB, normal)`
    *   **Signature**: `resolveImpulse(ballA, ballB, normal)`
    *   **Description**: Applies an impulse to two colliding balls to change their velocities according to the laws of conservation of momentum and the coefficient of restitution. It converts angular velocities to linear velocities for impulse calculation and then back to angular.
*   **Function**: `correctPositions(ballA, ballB, normal, overlap)`
    *   **Signature**: `correctPositions(ballA, ballB, normal, overlap)`
    *   **Description**: Separates two overlapping balls by adjusting their angles slightly along the collision normal, preventing them from "sinking" into each other. This is a small positional correction applied after impulse resolution.
*   **Function**: `handleAllCollisions()`
    *   **Signature**: `handleAllCollisions()`
    *   **Description**: The main collision resolution loop. It iteratively checks all unique pairs of balls for collisions. For each collision detected, it calls `resolveImpulse` and `correctPositions`. This process repeats for a fixed number of `COLLISION.SOLVER_ITERATIONS` or until no more impulses are applied in an iteration, ensuring chain reactions resolve within a single physics substep.

### `src/physics/PhysicsEngine.js`

*   **Class**: `PhysicsEngine`
    *   **Constructor Signature**: `constructor(config)`
    *   **Description**: Initializes the physics engine with a configuration object, synchronizes it with global `CONFIG`, and performs an initial reset.
    *   **Method**: `reset()`
        *   **Signature**: `reset()`
        *   **Description**: Resets the entire physics system, re-initializing balls and clearing collision counts.
    *   **Method**: `update(dt)`
        *   **Signature**: `update(dt)`
        *   **Description**: Advances the physics simulation by a given time step `dt`. It divides `dt` into smaller `FIXED_DT` substeps, calling `updateAllPendulums` (motion) and `handleAllCollisions` (collision) for each substep.
    *   **Method**: `setBallHeld(index, isHeld)`
        *   **Signature**: `setBallHeld(index, isHeld)`
        *   **Description**: Delegates to the `Ball` object's `setHeld` method for the specified ball.
    *   **Method**: `setBallAngle(index, angle)`
        *   **Signature**: `setBallAngle(index, angle)`
        *   **Description**: Delegates to the `Ball` object's `setAngle` method for the specified ball, used for drag interaction.
    *   **Method**: `applyInitialLaunchState(angle, liftedBallCount)`
        *   **Signature**: `applyInitialLaunchState(angle, liftedBallCount)`
        *   **Description**: Resets the system and then applies a specified initial launch `angle` (in degrees) to a given `liftedBallCount` of balls from one side, preparing them for release.
    *   **Method**: `getPositions()`
        *   **Signature**: `getPositions()`
        *   **Description**: Returns an array of `{x, y, z}` Cartesian coordinates for all balls, suitable for graphics updates.
    *   **Method**: `getStatus()`
        *   **Signature**: `getStatus()`
        *   **Description**: Gathers and returns a comprehensive status object containing various physics metrics (total velocity, momentum, kinetic/potential/total energy, energy transfer, collision count, individual ball velocities and angles, etc.) for display in the UI.

### `src/graphics/builders/CradleBuilder.js`

*   **Static Method**: `build(config)`
    *   **Signature**: `static build(config)`
    *   **Description**: Creates and returns a Three.js `Group` object representing the entire Newton's Cradle. It dynamically generates the support structure, balls, and threads based on the provided `config` (ball count, radius, thread length, etc.). It calculates precise spacing for the balls and attaches two threads per ball to the support bars.

### `src/graphics/builders/CradleUpdater.js`

*   **Class**: `CradleUpdater`
    *   **Constructor Signature**: `constructor(group)`
    *   **Description**: Initializes the updater with the Three.js `Group` containing the cradle elements. It stores references to the ball meshes and thread lines.
    *   **Method**: `updateBalls(positions)`
        *   **Signature**: `updateBalls(positions)`
        *   **Description**: Receives an array of `{x, y, z}` Cartesian positions from the physics engine and updates the corresponding Three.js ball meshes and thread lines to reflect these new positions in the 3D scene.

### `src/graphics/PhysicsBridge.js`

*   **Class**: `PhysicsBridge`
    *   **Constructor Signature**: `constructor(updater)`
    *   **Description**: Initializes the bridge with a `CradleUpdater` instance.
    *   **Method**: `updateBalls(positions)`
        *   **Signature**: `updateBalls(positions)`
        *   **Description**: The primary method called by the physics synchronization layer. It validates the incoming `positions` array and then delegates the actual 3D object updates to the `CradleUpdater`.

### `src/animation/StateSync.js`

*   **Class**: `StateSync`
    *   **Constructor Signature**: `constructor(physicsBridge, physics)`
    *   **Description**: Initializes with instances of `PhysicsBridge` and `PhysicsEngine`.
    *   **Method**: `sync(dt)`
        *   **Signature**: `sync(dt)`
        *   **Description**: The core synchronization logic per frame. It first calls `physics.update(dt)` to advance the simulation and then `physicsBridge.updateBalls(positions)` to update the graphics.

### `src/animation/AnimationController.js`

*   **Class**: `AnimationController`
    *   **Constructor Signature**: `constructor(onFrame)`
    *   **Description**: Initializes with a callback function `onFrame` that will be executed on each animation frame.
    *   **Method**: `start()`
        *   **Signature**: `start()`
        *   **Description**: Begins the animation loop by calling `requestAnimationFrame`.
    *   **Method**: `stop()`
        *   **Signature**: `stop()`
        *   **Description**: Halts the animation loop.
    *   **Method**: `tick()`
        *   **Signature**: `tick()`
        *   **Description**: The internal recursive function that drives the animation loop, calling `onFrame` and then scheduling the next `tick`.

### `src/interaction/DragController.js`

*   **Class**: `DragController`
    *   **Constructor Signature**: `constructor(camera, domElement, cradleGroupGetter, physics, orbitControls)`
    *   **Description**: Sets up event listeners for pointer interactions (down, move, up) on the rendering canvas. It uses Three.js raycasting to detect ball clicks.
    *   **Method**: `onPointerDown(event)`
        *   **Signature**: `onPointerDown(event)`
        *   **Description**: Detects if a ball is clicked. If so, it sets the ball's `held` state in the physics engine, disables `OrbitControls`, and prepares for dragging.
    *   **Method**: `onPointerMove(event)`
        *   **Signature**: `onPointerMove(event)`
        *   **Description**: During a drag, it calculates the new target position for the dragged ball on a fixed swing plane (z=0), clamps it to the thread length, converts it to an angle, and updates the ball's angle in the physics engine using `physics.setBallAngle`.
    *   **Method**: `onPointerUp(event)`
        *   **Signature**: `onPointerUp(event)`
        *   **Description**: Releases the dragged ball, sets its `held` state to `false` in the physics engine, and re-enables `OrbitControls`.

### `src/core/UIManager.js`

*   **Class**: `UIManager`
    *   **Constructor Signature**: `constructor(onReset, onPauseToggle, onResetDefaults, dragController, resetCamera, onApplyInitialMotion, audioManager)`
    *   **Description**: Initializes the UI manager, setting up `lil-gui` and `Chart.js` instances, and storing callbacks for various actions.
    *   **Method**: `createControls(params)`
        *   **Signature**: `createControls(params)`
        *   **Description**: Builds the `lil-gui` interface, adding folders and controllers for all configurable simulation parameters. It also sets up buttons for reset, pause, and applying initial motion.
    *   **Method**: `_createIndividualMassControls(params)`
        *   **Signature**: `_createIndividualMassControls(params)`
        *   **Description**: Dynamically creates or updates `lil-gui` controllers for individual ball masses, adapting to changes in `ballCount`.
    *   **Method**: `setControllerValues(values)`
        *   **Signature**: `setControllerValues(values)`
        *   **Description**: Updates the values displayed by the `lil-gui` controllers, typically used when resetting parameters to defaults.
    *   **Method**: `createStatusPanel()`
        *   **Signature**: `createStatusPanel()`
        *   **Description**: Creates the HTML elements for the real-time status display panel, including canvases for the velocity, momentum, energy, and ball activity charts.
    *   **Method**: `updateStatus(state)`
        *   **Signature**: `updateStatus(state)`
        *   **Description**: Receives the physics `state` object from `PhysicsEngine.getStatus()` and updates all displayed metrics and charts in the UI. It maintains a history for the line charts and updates the bar chart for individual ball activity.

## 4. Update/Render Loop

The simulation follows a standard game loop pattern, orchestrated by `main.js` and `AnimationController.js`.

1.  **Initialization (`main.js`)**:
    *   Three.js scene, camera, renderer, and lights are set up.
    *   `PhysicsEngine` is initialized with the current `CONFIG`.
    *   `CradleBuilder` constructs the initial 3D cradle, and `CradleUpdater` is created to manage its updates.
    *   `PhysicsBridge` is instantiated, linking the physics output to the graphics updater.
    *   `TimeManager` is created to track `deltaTime`.
    *   `UIManager` is initialized, creating the GUI controls and status panel.
    *   `DragController` and `KeyboardControls` are set up for user interaction.
    *   `StateSync` is created, connecting the `PhysicsEngine` and `PhysicsBridge`.
    *   `AnimationController` is instantiated with a callback function that defines the actions for each frame.

2.  **Animation Loop (`AnimationController.tick` called via `requestAnimationFrame`)**:
    *   **Timing/Delta Calculation**: `timeManager.update()` is called to calculate `dt` (delta time) since the last frame. This `dt` is clamped to prevent large jumps in simulation during lag spikes.
    *   **Physics Integration & Collision Handling (`stateSync.sync(dt)`)**:
        *   `physics.update(dt)` is called:
            *   The `dt` is divided into multiple fixed substeps (`PHYSICS.FIXED_DT`).
            *   For each substep:
                *   `updateAllPendulums(stepDt, infiniteMotion)` in `motion.js` integrates the angular position and velocity of each ball using RK4, applying gravity, damping, and air drag.
                *   `handleAllCollisions()` in `collision.js` iteratively detects and resolves collisions between balls using impulse-based methods and positional corrections.
        *   `physicsBridge.updateBalls(physics.getPositions())` is called:
            *   `physics.getPositions()` retrieves the updated Cartesian coordinates (`x`, `y`, `z`) of all balls from the physics state.
            *   `physicsBridge` passes these positions to `activeUpdater.updateBalls()`.
            *   `CradleUpdater.updateBalls()` updates the `position` of each Three.js ball mesh and recalculates the vertices of the thread `Line` geometries.
    *   **State Reporting (`uiManager.updateStatus(status)`)**:
        *   `physics.getStatus()` is called to gather various real-time metrics (energy, momentum, velocities, collision counts, etc.).
        *   `uiManager.updateStatus()` receives this data, updates the text in the status panel, pushes new values to the history arrays for the line charts, and updates the `Chart.js` instances.
    *   **Camera Controls Update**: `controls.update()` is called to process any camera movements (e.g., OrbitControls).
    *   **Rendering**: `renderer.render(scene, camera)` draws the updated 3D scene to the canvas.
    *   **Audio Feedback**: If `physics.getLastFrameCollisionCount()` is greater than 0, `audioManager.playCollision()` is triggered.
    *   **Loop Continuation**: `requestAnimationFrame` schedules the next `tick` call, perpetuating the loop.

## 5. State & Data Flow

**Simulation State:**
The core simulation state resides within the `src/physics/state.js` module, specifically in the `pendulumBalls` array. Each element in this array is an instance of the `Ball` class, which stores:
*   `id`: Unique identifier.
*   `pivotX`, `pivotY`: Cartesian coordinates of the fixed pivot point.
*   `angle`: Current angular position (radians).
*   `velocity`: Current angular velocity (radians/second).
*   `radius`: Physical radius of the ball.
*   `mass`: Mass of the ball.
*   `held`: Boolean indicating if the ball is being manually held (e.g., by drag interaction).
*   `x`, `y`: Derived Cartesian coordinates of the ball's center.

**Data Flow between Physics and Graphics:**

1.  **Physics to Graphics (Per Frame)**:
    *   The `PhysicsEngine` (`physics` instance in `main.js`) calculates the new angular state (`angle`, `velocity`) for each ball.
    *   Each `Ball` object internally updates its `x` and `y` Cartesian coordinates based on its angular state.
    *   `PhysicsEngine.getPositions()` extracts an array of `{x, y, z: 0}` objects from the `pendulumBalls` array.
    *   This array of Cartesian positions is passed to `StateSync.sync()`.
    *   `StateSync` then calls `physicsBridge.updateBalls()`.
    *   `PhysicsBridge` passes the positions to `CradleUpdater.updateBalls()`.
    *   `CradleUpdater` iterates through the 3D `Mesh` objects for the balls and `Line` geometries for the threads, updating their `position` and vertex data respectively to match the new Cartesian coordinates.

2.  **Graphics/Interaction to Physics (User Input)**:
    *   **Drag Interaction**:
        *   `DragController` detects a click on a 3D ball mesh.
        *   It calls `physics.setBallHeld(index, true)` to temporarily remove the ball from physics integration.
        *   As the user drags, `DragController` calculates a new `angle` based on the pointer's 2D screen position and the ball's pivot.
        *   It calls `physics.setBallAngle(index, newAngle)` to directly set the ball's angular position in the physics state.
        *   When released, `physics.setBallHeld(index, false)` is called.
    *   **UI Parameter Changes**:
        *   `UIManager`'s `lil-gui` controllers directly modify properties within the `params` object (which is linked to `physics.config`).
        *   Changes to parameters like `gravity`, `restitution`, `ballCount`, `ballRadius`, `threadLength`, `supportHeight`, `masses`, `initialLaunchAngle`, `liftedBallCount` trigger `uiManager.onReset()` or `uiManager.onApplyInitialMotion()`.
        *   These callbacks in turn call `physics.reset()` or `physics.applyInitialLaunchState()`, which re-initializes the `pendulumBalls` array or sets initial conditions based on the updated `physics.config`.
        *   `rebuildCradle()` is also called to update the 3D graphics representation if structural parameters (like `ballCount`) change.

## 6. Configurable Inputs

The simulation provides numerous user-adjustable parameters through the `lil-gui` interface, defined in `src/constants.js` and managed by `src/core/UIManager.js`.

*   **Gravity (`params.gravity`)**:
    *   **Controls**: The acceleration due to gravity (m/s²).
    *   **Effect**: Directly influences the `gravityTerm` in `calculateAngularAcceleration` (`motion.js`), affecting the swing period and force.
*   **Restitution (`params.restitution`)**:
    *   **Controls**: The coefficient of restitution (elasticity) for ball-on-ball collisions (0.00 = perfectly inelastic, 1.0 = perfectly elastic).
    *   **Effect**: Used in `resolveImpulse` (`collision.js`) to determine the post-collision velocities. Lower values lead to more energy loss during collisions.
*   **Infinite Motion (`params.infiniteMotion`)**:
    *   **Controls**: A boolean toggle to enable/disable energy loss mechanisms (viscous damping and air drag).
    *   **Effect**: If true, `viscousTerm` and `airDragTerm` are set to 0 in `calculateAngularAcceleration` (`motion.js`), and `restitution` is forced to 1.0, resulting in perpetual motion.
*   **Ball Count (`params.ballCount`)**:
    *   **Controls**: The number of balls in the Newton's Cradle (1 to 8).
    *   **Effect**: Triggers a full reset and rebuild of both the physics system (`initPhysicsSystem` in `state.js`) and the 3D graphics (`rebuildCradle` in `main.js`), dynamically adjusting the cradle width and individual mass controls.
*   **Ball Radius (`params.ballRadius`)**:
    *   **Controls**: The physical radius of each ball (meters).
    *   **Effect**: Influences collision detection (`getCollisionGeometry` in `collision.js`), cross-sectional area for air drag (`calculateCrossSection` in `motion.js`), and the visual size of the 3D balls. Triggers a full reset and rebuild.
*   **Thread Length (`params.threadLength`)**:
    *   **Controls**: The length of the threads suspending the balls (meters).
    *   **Effect**: Influences the pendulum period, angular acceleration (`motion.js`), and the visual length of the threads. Triggers a full reset and rebuild.
*   **Support Height (`params.supportHeight`)**:
    *   **Controls**: The height of the support structure from which the threads hang (meters).
    *   **Effect**: Determines the `pivotY` for the balls and the vertical position of the 3D support structure. Triggers a full reset and rebuild.
*   **Individual Ball Masses (`params.masses[i]`)**:
    *   **Controls**: The mass (kilograms) of each individual ball.
    *   **Effect**: Influences angular acceleration (`motion.js`), kinetic energy (`motion.js`), and impulse resolution (`collision.js`). Changes to individual masses trigger a full reset.
*   **Initial Launch Angle (`params.initialLaunchAngle`)**:
    *   **Controls**: The angle (degrees) from the vertical at which the initial `liftedBallCount` balls are raised.
    *   **Effect**: When "Apply Angle & Launch" is pressed, `physics.applyInitialLaunchState` is called, setting the initial conditions for the simulation.
*   **Lifted Ball Count (`params.liftedBallCount`)**:
    *   **Controls**: The number of balls to be lifted from one side for the initial launch.
    *   **Effect**: Used by `physics.applyInitialLaunchState` to determine which balls receive the `initialLaunchAngle`.
*   **Drag Enabled (`params.dragEnabled`)**:
    *   **Controls**: A boolean toggle to enable/disable the ability to drag balls with the mouse.
    *   **Effect**: Controls the `enabled` state of the `DragController`.
*   **Sound Enabled (`params.soundEnabled`)**:
    *   **Controls**: A boolean toggle to enable/disable collision sound effects.
    *   **Effect**: Controls the `enabled` state of the `AudioManager`.

## 7. Outputs

The simulation provides several forms of output to the user:

*   **Visual Output (Three.js Scene)**:
    *   **Description**: The primary output is the real-time 3D rendering of the Newton's Cradle, showing the balls swinging, colliding, and the threads moving. The scene includes realistic materials, lighting, shadows, and an environment map for reflections.
    *   **Computed From**: The `CradleUpdater` receives Cartesian coordinates from the `PhysicsEngine` via the `PhysicsBridge` and updates the positions of the Three.js `Mesh` objects for the balls and `Line` geometries for the threads.
*   **Real-time Status Panel (`UIManager`)**:
    *   **Description**: A dedicated UI panel displays various numerical metrics of the simulation in real-time.
    *   **Computed From**: `PhysicsEngine.getStatus()` aggregates data from `pendulumBalls` and `motion.js` (for energy calculations) and `collision.js` (for collision counts).
    *   **Metrics Displayed**:
        *   Total Velocity (m/s)
        *   Total Momentum (kg·m/s)
        *   Kinetic Energy (J)
        *   Potential Energy (J)
        *   Total Energy (J)
        *   Energy Lost per frame (J)
        *   Total Collisions
        *   Moving Balls (indices of balls currently in motion)
        *   Individual Ball Angles (degrees)
*   **Charts (`UIManager` using Chart.js)**:
    *   **Description**: Three line charts visualize the historical trends of total velocity, total momentum, and total energy over the last 60 frames. A bar chart shows the absolute linear velocity of each individual ball, highlighting which balls are currently active.
    *   **Computed From**: The `UIManager` receives `velocity`, `momentum`, `totalEnergy`, and `ballVelocities` from `PhysicsEngine.getStatus()`. It maintains a history array for each metric and updates the `Chart.js` instances accordingly.
*   **Audio Feedback (`AudioManager`)**:
    *   **Description**: A short, distinct "clack" sound effect is played whenever a collision occurs between balls.
    *   **Computed From**: `main.js` checks `physics.getLastFrameCollisionCount()` after each physics update. If greater than zero, `audioManager.playCollision()` is called.

## 8. Numerical Methods Used

The simulation employs specific numerical methods for integration and collision resolution to ensure accuracy and stability.

*   **Integration Method: Runge-Kutta 4th Order (RK4)**
    *   **Used in**: `src/physics/motion.js` (`rk4Step` function).
    *   **Description**: RK4 is a widely used and robust method for numerically solving ordinary differential equations (ODEs). In this simulation, it's applied to integrate the angular position (`angle`) and angular velocity (`omega`) of each pendulum ball over time. It calculates four intermediate estimates (k1, k2, k3, k4) of the slope (acceleration) within a time step `dt` to achieve a more accurate approximation of the next state compared to simpler methods like Euler integration.
    *   **Justification**: RK4 offers a good balance between accuracy and computational cost for this type of system. It provides higher accuracy (local error of O(dt⁵), global error of O(dt⁴)) than lower-order methods, which helps in maintaining energy conservation and stable motion over longer simulation times, especially for oscillatory systems like pendulums. This reduces numerical damping that would otherwise prematurely stop the motion.
*   **Collision Resolution: Impulse-Based Method with Iterative Solver and Positional Correction**
    *   **Used in**: `src/physics/collision.js` (`resolveImpulse`, `correctPositions`, `handleAllCollisions`).
    *   **Description**:
        *   **Impulse-Based**: When two balls are detected to be overlapping, an instantaneous impulse is calculated and applied to their velocities. This impulse is derived from the relative velocity of the balls along the collision normal, their masses, and the coefficient of restitution. It ensures conservation of momentum (for the colliding pair) and models the elasticity of the collision.
        *   **Iterative Solver**: Instead of a single pass, `handleAllCollisions` performs multiple iterations (`COLLISION.SOLVER_ITERATIONS`) within each physics substep. In each iteration, it checks all ball pairs and applies impulses. This iterative approach is crucial for resolving "chain reactions" (like in a Newton's Cradle) where an impulse from one collision propagates through multiple balls. Without it, momentum transfer would be incomplete or inaccurate, leading to "twitching" or incorrect energy transfer.
        *   **Positional Correction (Sequential Impulse)**: After applying the impulse, `correctPositions` is used to slightly separate any still-overlapping balls. This "positional slop" and "correction percentage" method prevents balls from sinking into each other due to numerical inaccuracies or large overlaps, improving visual stability.
    *   **Justification**: Impulse-based methods are standard for rigid-body collision response in games and simulations due to their efficiency and ability to handle complex collision scenarios. The iterative solver specifically addresses the challenge of simultaneous or cascading collisions, which are fundamental to the Newton's Cradle behavior, ensuring that the momentum is transferred cleanly through the chain of balls.
*   **Damping Mechanisms**:
    *   **Viscous Damping**: A term proportional to angular velocity (`-k * omega`) is added to the angular acceleration (`motion.js`). This models energy loss due to air resistance or internal friction, causing the pendulums to eventually come to rest.
    *   **Air Drag**: A term proportional to the square of angular velocity (`-k' * omega * |omega|`) is also included (`motion.js`). This provides a more physically accurate model of air resistance, which typically increases with the square of velocity.
    *   **Justification**: These damping terms are essential for a realistic simulation, as real-world pendulums do not swing indefinitely. They allow the user to observe the gradual decay of motion and energy, unless `infiniteMotion` is enabled.

## 9. Known Limitations or Simplifications

The current implementation makes several assumptions and simplifications compared to a fully accurate, real-world physics simulation:

*   **2D Pendulum Motion**: The simulation assumes all pendulum motion occurs strictly in the X-Y plane (z=0). Balls only have `x` and `y` Cartesian coordinates, and their pivots are fixed in this plane. While the 3D rendering gives the illusion of depth, the physics calculations are 2D. This simplifies the math significantly but limits the complexity of possible motions.
*   **Fixed Thread Length**: The threads are assumed to be inextensible and of fixed length. There is no simulation of thread elasticity or breakage.
*   **Rigid Body Balls**: Balls are treated as perfect rigid spheres. There is no deformation upon collision, and their rotation is not explicitly simulated (only angular position and velocity of the pendulum swing).
*   **Simplified Collision Geometry**: Collision detection only considers sphere-sphere intersection. More complex shapes or interactions (e.g., threads colliding with each other or the support structure) are not modeled.
*   **Instantaneous Impulse Application**: Collision impulses are applied instantaneously. While the iterative solver helps, it's still an approximation of a continuous contact force.
*   **No External Forces (beyond gravity, drag, damping)**: The simulation does not account for external forces other than gravity, viscous damping, air drag, and user-initiated drag. Wind, magnetic fields, or other environmental factors are not included.
*   **Fixed Time Step Substeps**: The physics engine uses fixed substeps (`PHYSICS.FIXED_DT`) for integration. While this improves stability, an adaptive time-stepping approach could offer better performance for varying simulation complexities.
*   **UI Parameter Coupling**: Some UI parameters (e.g., `ballCount`, `ballRadius`) trigger a full reset and rebuild of the entire cradle. This is necessary due to the way the cradle geometry and physics state are constructed, but it means changes to these parameters cannot be applied dynamically without restarting the simulation from rest.
*   **Drag Interaction Simplification**: When a ball is dragged, its motion is directly controlled by the user's pointer on a fixed plane, overriding physics integration. The clamping to the thread length ensures visual consistency, but the underlying physics for the dragged ball is paused.
*   **No Thread Slack/Tension Simulation**: The threads are implicitly assumed to be under tension. There's no explicit check or simulation for slack in the threads if a ball were to move faster than its pendulum arc allows (e.g., if an extreme external force were applied).