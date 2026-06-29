// src/graphics/scene/SceneManager.js
import * as THREE from 'three';

export class SceneManager {
    constructor() {
        // 1. المشهد
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e); // خلفية داكنة أنيقة

        // 2. الكاميرا (نظرتها على البندول من زاوية جميلة)
        this.camera = new THREE.PerspectiveCamera(
            45,                                      // مجال الرؤية
            window.innerWidth / window.innerHeight,  // نسبة الأبعاد
            0.1,                                     // أقرب مستوى قطع
            100                                      // أبعد مستوى قطع
        );
        this.camera.position.set(6, 4, 8);           // مكان الكاميرا
        this.camera.lookAt(0, 1.5, 0);               // تنظر إلى منتصف البندول تقريباً

        // 3. العارض (Renderer)
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true                          // تنعيم الحواف
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // أداء أفضل
        this.renderer.shadowMap.enabled = true;      // تفعيل الظلال (مفيد لاحقاً)
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // ظلال ناعمة
        document.body.appendChild(this.renderer.domElement);

        // 4. استجابة تغيير حجم النافذة (ربطها بالكلاس نفسه)
        this._handleResize = this._handleResize.bind(this);
        window.addEventListener('resize', this._handleResize);
    }

    // دالة لتحديث الحجم
    _handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // دوال عامة لاسترجاع العناصر
    getScene() { return this.scene; }
    getCamera() { return this.camera; }
    getRenderer() { return this.renderer; }
}