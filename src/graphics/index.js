// src/graphics/index.js
import { SceneManager } from './scene/SceneManager.js';
import { LightsManager } from './scene/LightsManager.js';
import { CradleBuilder } from './builders/CradleBuilder.js'; // Keep import for export
import { CradleUpdater } from './builders/CradleUpdater.js'; // Keep import for export
import { CONFIG } from '../constants.js';
import  PhysicsBridge  from './PhysicsBridge.js';

// 1. بيئة العرض
const sceneManager = new SceneManager();
const scene = sceneManager.getScene();
const camera = sceneManager.getCamera();
const renderer = sceneManager.getRenderer();

// 2. الإضاءة
const lightsManager = new LightsManager();
lightsManager.addToScene(scene);

// 3. بناء البندول وإضافته للمشهد - REMOVED from here
// const cradleGroup = CradleBuilder.build(CONFIG);
// scene.add(cradleGroup);

// 4. تجهيز المُحدِّث - REMOVED from here
// const updater = new CradleUpdater(cradleGroup);

// 5. تصدير كل ما يحتاجه main.js
// Export CradleBuilder and CradleUpdater classes directly
export { scene, camera, renderer, CradleBuilder, CradleUpdater, PhysicsBridge };