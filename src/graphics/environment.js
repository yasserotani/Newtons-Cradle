import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

export function setupEnvironmentMap(scene, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const exrLoader = new EXRLoader();
  exrLoader.load('/assets/neon_photostudio_4k.exr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap; // lighting for PBR materials (metal balls, reflections)
    scene.background = envMap;  // optional: use as visible background too

    texture.dispose();
    pmremGenerator.dispose();
  });
}