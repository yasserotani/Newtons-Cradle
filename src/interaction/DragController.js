import * as THREE from 'three';

export class DragController {
    constructor(camera, domElement, cradleGroupGetter, physics, orbitControls) {
        this.camera = camera;
        this.domElement = domElement;
        this.cradleGroupGetter = cradleGroupGetter; // function to get the current cradleGroup
        this.physics = physics;
        this.orbitControls = orbitControls;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.isDragging = false;
        this.draggedBallIndex = -1;
        this.intersectionPlane = new THREE.Plane();
        this.offset = new THREE.Vector3(); // Offset from intersection point to ball center

        this.enabled = true;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);

        // Prevent the browser from hijacking touch gestures (scroll/pinch)
        // during a drag on mobile.
        this.domElement.style.touchAction = 'none';

        this.domElement.addEventListener('pointerdown', this.onPointerDown);
        this.domElement.addEventListener('pointermove', this.onPointerMove);
        this.domElement.addEventListener('pointerup', this.onPointerUp);
        // pointercancel fires when the browser interrupts the gesture
        // (OS gesture, tab switch, etc.) — without this, isDragging could
        // get stuck true forever with OrbitControls permanently disabled.
        this.domElement.addEventListener('pointercancel', this.onPointerUp);
    }

    dispose() {
        this.domElement.removeEventListener('pointerdown', this.onPointerDown);
        this.domElement.removeEventListener('pointermove', this.onPointerMove);
        this.domElement.removeEventListener('pointerup', this.onPointerUp);
        this.domElement.removeEventListener('pointercancel', this.onPointerUp);
    }

    setEnabled(value) {
        this.enabled = value;
        if (!this.enabled && this.isDragging) {
            // If dragging is disabled mid-drag, release the held ball.
            this.onPointerUp({ pointerId: -1 });
        }
        if (!this.enabled && !this.isDragging) {
            this.orbitControls.enabled = true;
        }
    }

    onPointerDown(event) {
        if (!this.enabled || event.button !== 0) return;

        const cradleGroup = this.cradleGroupGetter();
        if (!cradleGroup) return;

        const ballMeshes = cradleGroup.userData.balls;
        if (!ballMeshes || ballMeshes.length === 0) return;

        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        // Raycast ONLY against ball meshes — previously this raycast
        // against every child (threads, supports, pillars), so a
        // non-ball hit closer along the ray could silently block dragging.
        const intersects = this.raycaster.intersectObjects(ballMeshes, false);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            this.draggedBallIndex = ballMeshes.indexOf(intersectedObject);

            if (this.draggedBallIndex !== -1) {
                this.isDragging = true;
                this.physics.setBallHeld(this.draggedBallIndex, true);
                this.orbitControls.enabled = false;

                // Fixed swing plane at z = 0, matching state.js (all
                // pendulum motion happens in the x-y plane). Using a
                // camera-facing plane here instead would make drag
                // sensitivity inconsistent at oblique camera angles.
                this.intersectionPlane.setFromNormalAndCoplanarPoint(
                    new THREE.Vector3(0, 0, 1),
                    new THREE.Vector3(0, 0, 0)
                );

                this.offset.copy(intersectedObject.position).sub(intersects[0].point);

                if (event.pointerId !== undefined) {
                    this.domElement.setPointerCapture(event.pointerId);
                }
            }
        }
    }

    onPointerMove(event) {
        if (!this.enabled || !this.isDragging) return;

        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        const intersection = new THREE.Vector3();
        const hit = this.raycaster.ray.intersectPlane(this.intersectionPlane, intersection);

        if (hit) {
            const targetPosition = intersection.add(this.offset);
            const ball = this.physics.balls[this.draggedBallIndex];
            const L = this.physics.config.threadLength;

            // Angle measured from the negative Y axis (straight down).
            const dx = targetPosition.x - ball.pivotX;
            const dy = ball.pivotY - targetPosition.y; // Y inverted for angle calc

            // Clamp target onto the circle of radius L around the pivot,
            // so the thread never visually stretches.
            const distFromPivot = Math.sqrt(dx * dx + dy * dy);
            const ratio = L / Math.max(distFromPivot, 0.001);
            const clampedDx = dx * ratio;
            const clampedDy = dy * ratio;

            const angle = Math.atan2(clampedDx, clampedDy);

            this.physics.setBallAngle(this.draggedBallIndex, angle);
        }
    }

    onPointerUp(event) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.physics.setBallHeld(this.draggedBallIndex, false);
        this.orbitControls.enabled = true;

        // event.pointerId is -1 for the synthetic event from setEnabled(),
        // and releasePointerCapture can throw if called with an ID that
        // was never actually captured — guard against both.
        if (event.pointerId !== undefined && event.pointerId !== -1) {
            try {
                this.domElement.releasePointerCapture(event.pointerId);
            } catch (e) {
                // No-op: pointer capture was already released or never set.
            }
        }

        this.draggedBallIndex = -1;
    }
}