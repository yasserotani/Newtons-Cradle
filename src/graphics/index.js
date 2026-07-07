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

export { scene, camera, renderer, CradleBuilder, CradleUpdater, PhysicsBridge };