// src/graphics/materials/CradleMaterials.js
import * as THREE from 'three';

export const CradleMaterials = {
    /**
     * مادة الكرات (ذهب لامع)
     */
    getBallMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            metalness: 0.9,
            roughness: 0.15,
            envMapIntensity: 1.0,
        });
    },

    /**
     * مادة الخيوط (فضي معتم)
     */
    getThreadMaterial() {
        return new THREE.LineBasicMaterial({
            color: 0xccccdd,
            transparent: true,
            opacity: 0.8,
        });
    },

};

