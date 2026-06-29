// src/graphics/builders/CradleBuilder.js
import * as THREE from 'three';
import { CradleMaterials } from '../materials/CradleMaterials.js'; // استيراد المواد

export class CradleBuilder {
    static build(config) {
        const group = new THREE.Group();
        const { ballCount, ballRadius, supportHeight, spreadZ, cradleWidth, colors, threadLength } = config;

        // حساب المسافات بين الكرات
        const spacing = cradleWidth / (ballCount - 1);
        const startX = -cradleWidth / 2;

        // ----- 1. بناء العارضتين المتوازيتين -----
        const supportMat = CradleMaterials.getSupportMaterial();
        // جسم العارضة (شريط طويل)
        const supportGeo = new THREE.BoxGeometry(cradleWidth + 0.6, 0.15, 0.15);
        
        // العارضة الأمامية (Z موجب)
        const supportFront = new THREE.Mesh(supportGeo, supportMat);
        supportFront.position.set(0, supportHeight, spreadZ);
        supportFront.castShadow = true;
        supportFront.receiveShadow = true;
        group.add(supportFront);

        // العارضة الخلفية (Z سالب)
        const supportBack = new THREE.Mesh(supportGeo, supportMat);
        supportBack.position.set(0, supportHeight, -spreadZ);
        supportBack.castShadow = true;
        supportBack.receiveShadow = true;
        group.add(supportBack);

        // (اختياري) إضافة أعمدة رأسية صغيرة في الأطراف لمظهر واقعي
        const pillarMat = CradleMaterials.getPillarMaterial();
        const pillarGeo = new THREE.BoxGeometry(0.1, supportHeight, 0.1);
        const positions = [-cradleWidth/2 - 0.3, cradleWidth/2 + 0.3];
        positions.forEach(x => {
            [-spreadZ, spreadZ].forEach(z => {
                const pillar = new THREE.Mesh(pillarGeo, pillarMat);
                pillar.position.set(x, supportHeight/2, z);
                pillar.castShadow = true;
                pillar.receiveShadow = true;
                group.add(pillar);
            });
        });

        // ----- 2. بناء الكرات والخيوط -----
        const ballMat = CradleMaterials.getBallMaterial();
        const ballGeo = new THREE.SphereGeometry(ballRadius, 32, 32);
        const threadMat = CradleMaterials.getThreadMaterial();
        
        const balls = [];
        const threads = [];

        for (let i = 0; i < ballCount; i++) {
            const x = startX + i * spacing;
            const y = supportHeight - threadLength; // معلقة لأسفل
            const z = 0;

            // ---- الكرة ----
            const ball = new THREE.Mesh(ballGeo, ballMat);
            ball.position.set(x, y, z);
            ball.castShadow = true;
            ball.receiveShadow = true;
            group.add(ball);
            balls.push(ball);

            // ---- الخيط الأول (الأمامي) ----
            const startFront = new THREE.Vector3(x, supportHeight, spreadZ);
            const end = new THREE.Vector3(x, y, z);
            // استخدام مادة الخيط من CradleMaterials
            
            const frontGeo = new THREE.BufferGeometry().setFromPoints([startFront, end]);
            const frontLine = new THREE.Line(frontGeo, threadMat);
            group.add(frontLine);

            // ---- الخيط الثاني (الخلفي) ----
            const startBack = new THREE.Vector3(x, supportHeight, -spreadZ);
            const backGeo = new THREE.BufferGeometry().setFromPoints([startBack, end]);
            const backLine = new THREE.Line(backGeo, threadMat);
            group.add(backLine);

            // نخزّن مراجع الخيوط مع نقطة البداية الثابتة لكل خيط
            threads.push({
                front: { line: frontLine, start: startFront.clone() },
                back: { line: backLine, start: startBack.clone() }
            });
        }

        // نخزّن البيانات داخل المجموعة عشان الـ Updater يستخدمها
        group.userData.balls = balls;
        group.userData.threads = threads;
        group.userData.config = config;

        return group;
    }
}