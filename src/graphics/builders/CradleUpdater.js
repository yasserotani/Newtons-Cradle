// src/graphics/builders/CradleUpdater.js
import * as THREE from 'three';

export class CradleUpdater {
    constructor(group) {
        this.group = group;
        this.balls = group.userData.balls;
        this.threads = group.userData.threads;
    }

    /**
     * تُستدعى هذه الدالة في كل إطار من قبل main.js
     * @param {Array} positions - مصفوفة تحتوي على {x, y, z} لكل كرة
     */
    updateBalls(positions) {
        if (!positions || positions.length !== this.balls.length) {
            console.warn('⚠️ عدد الإحداثيات لا يتطابق مع عدد الكرات');
            return;
        }

        for (let i = 0; i < this.balls.length; i++) {
            const pos = positions[i];
            const ball = this.balls[i];
            const threadPair = this.threads[i];

            // 1. تحديث موقع الكرة
            ball.position.set(pos.x, pos.y, pos.z);

            // 2. تحديث الخيط الأمامي
            const frontPos = threadPair.front.line.geometry.attributes.position;
            frontPos.setXYZ(0, threadPair.front.start.x, threadPair.front.start.y, threadPair.front.start.z);
            frontPos.setXYZ(1, pos.x, pos.y, pos.z);
            frontPos.needsUpdate = true; // إعلام Three.js بأن البيانات تغيرت

            // 3. تحديث الخيط الخلفي
            const backPos = threadPair.back.line.geometry.attributes.position;
            backPos.setXYZ(0, threadPair.back.start.x, threadPair.back.start.y, threadPair.back.start.z);
            backPos.setXYZ(1, pos.x, pos.y, pos.z);
            backPos.needsUpdate = true;
        }
    }
}