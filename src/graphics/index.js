// src/graphics/index.js
import { SceneManager } from './scene/SceneManager.js';
import { LightsManager } from './scene/LightsManager.js';
import { CradleBuilder } from './builders/CradleBuilder.js';
import { CradleUpdater } from './builders/CradleUpdater.js';
import { CONFIG } from '../constants.js';
import  PhysicsBridge  from './PhysicsBridge.js';

// ... باقي الكود (نفس ما كتبناه سابقاً) ...
// 1. بيئة العرض
const sceneManager = new SceneManager();
const scene = sceneManager.getScene();
const camera = sceneManager.getCamera();
const renderer = sceneManager.getRenderer();

// 2. الإضاءة
const lightsManager = new LightsManager();
lightsManager.addToScene(scene);

// 3. بناء البندول وإضافته للمشهد
const cradleGroup = CradleBuilder.build(CONFIG);
scene.add(cradleGroup);

// 4. تجهيز المُحدِّث
const updater = new CradleUpdater(cradleGroup);

// 5. تصدير كل ما يحتاجه main.js
export { scene, camera, renderer, cradleGroup, updater, PhysicsBridge };