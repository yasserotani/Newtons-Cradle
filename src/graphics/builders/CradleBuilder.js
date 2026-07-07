// src/graphics/builders/CradleBuilder.js
import * as THREE from "three";
import { CradleMaterials } from "./CradleMaterials.js";
export function createCradleArm(cradleWidth, barZOffset) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.2
  });
  material.side = THREE.DoubleSide;

  const group = new THREE.Group();

  const originalBarTopHalfWidth = 1.6;
  const originalBarTotalHalfWidth = 2.0;


  const newBarTopHalfWidth = cradleWidth / 2;
  const overhang = originalBarTotalHalfWidth - originalBarTopHalfWidth;
  const newBarTotalHalfWidth = newBarTopHalfWidth + overhang;

  // Calculate new stand width based on the total width of the bars at their base
  const standXBuffer = 1.5; // Increased buffer to make the stand wider in X
  const newStandWidth = (newBarTotalHalfWidth * 2) + standXBuffer;

  // Calculate new stand depth based on barZOffset
  const standZBuffer = 0.5; // Buffer for the stand's Z-depth
  const newStandDepth = (barZOffset * 2) + standZBuffer;


  // --- Bar 1 (Front) ---
  const path1 = new THREE.CurvePath();
  path1.add(
      new THREE.LineCurve3(
          new THREE.Vector3(-newBarTotalHalfWidth, -0.75, barZOffset),
          new THREE.Vector3(-newBarTotalHalfWidth, 1.6, barZOffset)
      )
  );
  path1.add(
      new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-newBarTotalHalfWidth, 1.6, barZOffset),
          new THREE.Vector3(-newBarTotalHalfWidth, 2, barZOffset),
          new THREE.Vector3(-newBarTopHalfWidth, 2, barZOffset)
      )
  );
  path1.add(
      new THREE.LineCurve3(
          new THREE.Vector3(-newBarTopHalfWidth, 2, barZOffset),
          new THREE.Vector3(newBarTopHalfWidth, 2, barZOffset)
      )
  );
  path1.add(
      new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(newBarTopHalfWidth, 2, barZOffset),
          new THREE.Vector3(newBarTotalHalfWidth, 2, barZOffset),
          new THREE.Vector3(newBarTotalHalfWidth, 1.6, barZOffset)
      )
  );
  path1.add(
      new THREE.LineCurve3(
          new THREE.Vector3(newBarTotalHalfWidth, 1.6, barZOffset),
          new THREE.Vector3(newBarTotalHalfWidth, -0.75, barZOffset)
      )
  );
  const geometry1 = new THREE.TubeGeometry(path1, 128, 0.045, 16, false);
  const mesh1 = new THREE.Mesh(geometry1, material);
  mesh1.castShadow = true;
  mesh1.receiveShadow = true;
  group.add(mesh1);

  // --- Bar 2 (Back) ---
  const path2 = new THREE.CurvePath();
  path2.add(
      new THREE.LineCurve3(
          new THREE.Vector3(-newBarTotalHalfWidth, -0.75, -barZOffset),
          new THREE.Vector3(-newBarTotalHalfWidth, 1.6, -barZOffset)
      )
  );
  path2.add(
      new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-newBarTotalHalfWidth, 1.6, -barZOffset),
          new THREE.Vector3(-newBarTotalHalfWidth, 2, -barZOffset),
          new THREE.Vector3(-newBarTopHalfWidth, 2, -barZOffset)
      )
  );
  path2.add(
      new THREE.LineCurve3(
          new THREE.Vector3(-newBarTopHalfWidth, 2, -barZOffset),
          new THREE.Vector3(newBarTopHalfWidth, 2, -barZOffset)
      )
  );
  path2.add(
      new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(newBarTopHalfWidth, 2, -barZOffset),
          new THREE.Vector3(newBarTotalHalfWidth, 2, -barZOffset),
          new THREE.Vector3(newBarTotalHalfWidth, 1.6, -barZOffset)
      )
  );
  path2.add(
      new THREE.LineCurve3(
          new THREE.Vector3(newBarTotalHalfWidth, 1.6, -barZOffset),
          new THREE.Vector3(newBarTotalHalfWidth, -0.75, -barZOffset)
      )
  );
  const geometry2 = new THREE.TubeGeometry(path2, 128, 0.045, 16, false);
  const mesh2 = new THREE.Mesh(geometry2, material);
  mesh2.castShadow = true;
  mesh2.receiveShadow = true;
  group.add(mesh2);

  // --- Stand ---
  const standMaterial = new THREE.MeshStandardMaterial({
    color: 0x505050,
    metalness: 0.7,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });
  // Use newStandWidth for the x-dimension, and newStandDepth for the z-dimension
  const standGeo = new THREE.BoxGeometry(newStandWidth, 0.25, newStandDepth, 16, 16, 16);
  const stand = new THREE.Mesh(standGeo, standMaterial);
  stand.position.y = -0.75;
  stand.castShadow = true;
  stand.receiveShadow = true;
  group.add(stand);

  return group
}
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