// src/graphics/scene/LightsManager.js
import * as THREE from 'three';

export class LightsManager {
    constructor() {
        this.lights = [];
    }

    // نضيف كل الإضاءات إلى المشهد
    addToScene(scene) {
        // 1. إضاءة محيطية (تنير كل شيء بشكل متساوٍ)
        const ambient = new THREE.AmbientLight(0x606080); // لون مائل للأزرق الخفيف، تم زيادة السطوع
        scene.add(ambient);
        this.lights.push(ambient);

        // 2. إضاءة نهارية (Hemisphere) - لون من الأعلى والأسفل
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.2); // تم زيادة الشدة
        scene.add(hemi);
        this.lights.push(hemi);

        // 3. الإضاءة الرئيسية (Directional) مع ظلال
        const mainLight = new THREE.DirectionalLight(0xffeedd, 2.5); // تم زيادة الشدة
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
        const fillLight = new THREE.DirectionalLight(0x4466ff, 0.6); // تم زيادة الشدة
        fillLight.position.set(-3, 2, -4);
        scene.add(fillLight);
        this.lights.push(fillLight);

        // اختياري: مساعد لمعرفة اتجاه الضوء (مفيد للاختبار)
        // const helper = new THREE.DirectionalLightHelper(mainLight, 1);
        // scene.add(helper);
    }
}