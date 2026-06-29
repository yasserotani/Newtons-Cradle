// src/main.js
import { scene, camera, renderer, updater, PhysicsBridge } from './graphics/index.js';
import { CONFIG } from './constants.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ----- إنشاء الجسر (الواجهة التي سيراها فريق الفيزياء) -----
const physicsBridge = new PhysicsBridge(updater);

// ----- إضافة أدوات التحكم -----
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, CONFIG.supportHeight - CONFIG.threadLength, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ----- شبكة أرضية -----
const gridHelper = new THREE.GridHelper(8, 16, 0x888888, 0x444444);
gridHelper.position.y = -0.2;
scene.add(gridHelper);

// ----- متغيرات المحاكاة المؤقتة (ستُحذف عندما يسلم فريق الفيزياء شغلهم) -----
let time = 0;

// ----- حلقة العرض -----
function animate() {
    requestAnimationFrame(animate);
    time += 0.02;

    // ===== محاكي فيزياء مؤقت (سيُستبدل باستدعاء من فريق الفيزياء) =====
    const { ballCount, cradleWidth, supportHeight, threadLength } = CONFIG;
    const spacing = cradleWidth / (ballCount - 1);
    const startX = -cradleWidth / 2;
    const positions = [];

    for (let i = 0; i < ballCount; i++) {
        const x = startX + i * spacing;
        let offsetX = 0;
        if (i === 0) { // الكرة الأولى فقط تتأرجح
            offsetX = Math.sin(time) * 0.7;
        }
        const y = supportHeight - threadLength;
        positions.push({ x: x + offsetX, y: y, z: 0 });
    }
    // =============================================================

    // **نمرر البيانات عبر الجسر (بنفس الطريقة اللي حيستخدمها فريق الفيزياء)**
    physicsBridge.updateBalls(positions);

    controls.update();
    renderer.render(scene, camera);
}
animate();

// ----- استجابة تغيير حجم النافذة -----
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----- نعرض الجسر على الـ Window عشان فريق الفيزياء يلاقوه بسهولة (للاختبار) -----
window.physicsBridge = physicsBridge;
console.log('✅ النظام جاهز. فريق الفيزياء يمكنه استخدام window.physicsBridge.updateBalls(positions)');