// src/graphics/scene/LightsManager.js
import * as THREE from 'three';

export class LightsManager {
    constructor() {
        this.lights = [];
    }

    // نضيف كل الإضاءات إلى المشهد
    addToScene(scene) {
        // 1. إضاءة محيطية (تنير كل شيء بشكل متساوٍ)
        const ambient = new THREE.AmbientLight(0x606080, 1.5); // Increased intensity
        scene.add(ambient);
        this.lights.push(ambient);

        // 2. إضاءة نهارية (Hemisphere) - لون من الأعلى والأسفل
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.8); // Increased intensity
        scene.add(hemi);
        this.lights.push(hemi);

        // 3. الإضاءة الرئيسية (Directional) مع ظلال
        const mainLight = new THREE.DirectionalLight(0xffeedd, 3.0); // Increased intensity
        mainLight.position.set(5, 10, 7); // من الأعلى جهة اليمين
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 20;
        mainLight.shadow.camera.left = -5;
        mainLight.shadow.camera.right = 5;
        mainLight.shadow.camera.top = 5;
        mainLight.shadow.camera.bottom = -5;
        scene.add(mainLight);
        this.lights.push(mainLight);

        // 4. إضاءة خلفية (Fill Light) لتخفيف الظلال القاسية
        const fillLight = new THREE.DirectionalLight(0x4466ff, 1.0); // Increased intensity
        fillLight.position.set(-3, 2, -4);
        scene.add(fillLight);
        this.lights.push(fillLight);

        // 5. إضاءة نقطية إضافية (PointLight) لإبراز التفاصيل
        const pointLight = new THREE.PointLight(0xffffff, 0.7, 10); // White light, intensity 0.7, distance 10
        pointLight.position.set(0, 3, 0); // Positioned above the cradle
        pointLight.castShadow = true;
        scene.add(pointLight);
        this.lights.push(pointLight);

        // اختياري: مساعد لمعرفة اتجاه الضوء (مفيد للاختبار)
        // const helper = new THREE.DirectionalLightHelper(mainLight, 1);
        // scene.add(helper);
    }
}