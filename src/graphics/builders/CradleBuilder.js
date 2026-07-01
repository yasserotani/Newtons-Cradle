// src/graphics/builders/CradleBuilder.js
import * as THREE from "three";
import { CradleMaterials, createCradleArm } from "../materials/CradleMaterials.js";

export class CradleBuilder {
  static build(config) {
    const group = new THREE.Group();
    const {
      ballCount,
      ballRadius,
      supportHeight,
      spreadZ,
      cradleWidth, // cradleWidth is now available in config
      threadLength,
    } = config;

    const spacing = cradleWidth / Math.max(ballCount - 1, 1);
    const startX = -cradleWidth / 2;

    // ----- 1. بناء العارضة الواحدة مع شريطين -----
    // createCradleArm now creates two bars internally, so we call it once.
    // Pass cradleWidth as the first argument and spreadZ as the second (barZOffset)
    const cradleArm = createCradleArm(cradleWidth, spreadZ);
    cradleArm.position.y = supportHeight - 2;
    cradleArm.position.z = 0; // The entire arm group is centered at Z=0
    group.add(cradleArm);

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

      // ---- الخيوط ----
      // Attach two threads to the two bars of the single stand
      // The bars are now at +spreadZ and -spreadZ relative to the cradleArm's local Z=0
      // Since cradleArm.position.z is 0, these are also the world Z positions.
      const startTopBarFront = new THREE.Vector3(x, supportHeight, spreadZ);
      const startTopBarBack = new THREE.Vector3(x, supportHeight, -spreadZ);
      const end = new THREE.Vector3(x, y, z);

      const frontThreadGeo = new THREE.BufferGeometry().setFromPoints([
        startTopBarFront,
        end,
      ]);
      const frontThreadLine = new THREE.Line(frontThreadGeo, threadMat);
      group.add(frontThreadLine);

      const backThreadGeo = new THREE.BufferGeometry().setFromPoints([
        startTopBarBack,
        end,
      ]);
      const backThreadLine = new THREE.Line(backThreadGeo, threadMat);
      group.add(backThreadLine);

      // نخزّن مراجع الخيوط مع نقطة البداية الثابتة لكل خيط
      threads.push({
        front: { line: frontThreadLine, start: startTopBarFront.clone() },
        back: { line: backThreadLine, start: startTopBarBack.clone() },
      });
    }

    // نخزّن البيانات داخل المجموعة عشان الـ Updater يستخدمها
    group.userData.balls = balls;
    group.userData.threads = threads;
    group.userData.config = config;

    return group;
  }
}