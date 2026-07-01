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

    /**
     * مادة العارضات (رمادي معدني)
     */
    getSupportMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x445566,
            metalness: 0.6,
            roughness: 0.4,
        });
    },

    /**
     * مادة الأعمدة (داكنة قليلاً)
     */
    getPillarMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x334455,
            metalness: 0.5,
            roughness: 0.5,
        });
    }
};

export function createCradleArm(cradleWidth, barZOffset) { // barZOffset is now passed from CradleBuilder
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 1,
      roughness: 0.2
    });
    material.side = THREE.DoubleSide;

    const group = new THREE.Group();

    // Original dimensions for scaling reference
    const originalBarTopHalfWidth = 1.6;
    const originalBarTotalHalfWidth = 2.0; // This is the -2 to 2 extent

    // Calculate new half-widths based on the provided cradleWidth
    // Assuming cradleWidth corresponds to the 'top bar' section (from -1.6 to 1.6)
    const newBarTopHalfWidth = cradleWidth / 2;
    const overhang = originalBarTotalHalfWidth - originalBarTopHalfWidth; // The fixed overhang from the top bar to the total width
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