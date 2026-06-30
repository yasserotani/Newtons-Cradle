import * as THREE from 'three';

export class DragController {
    constructor(camera, domElement, cradleGroupGetter, physics, orbitControls) {
        this.camera = camera;
        this.domElement = domElement;
        this.cradleGroupGetter = cradleGroupGetter; // Now a function to get the current cradleGroup
        this.physics = physics;
        this.orbitControls = orbitControls;

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.isDragging = false;
        this.draggedBallIndex = -1;
        this.intersectionPlane = new THREE.Plane();
        this.offset = new THREE.Vector3(); // Offset from intersection point to ball center

        this.enabled = true; // New property: controls if drag is active

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);

        this.domElement.addEventListener('pointerdown', this.onPointerDown);
        this.domElement.addEventListener('pointermove', this.onPointerMove);
        this.domElement.addEventListener('pointerup', this.onPointerUp);
    }

    dispose() {
        this.domElement.removeEventListener('pointerdown', this.onPointerDown);
        this.domElement.removeEventListener('pointermove', this.onPointerMove);
        this.domElement.removeEventListener('pointerup', this.onPointerUp);
    }

    setEnabled(value) {
        this.enabled = value;
        if (!this.enabled && this.isDragging) {
            // If dragging is disabled while a ball is held, release it
            this.onPointerUp({ pointerId: -1 }); // Simulate pointerup
        }
        // Ensure OrbitControls are enabled if drag is disabled and not dragging
        if (!this.enabled && !this.isDragging) {
            this.orbitControls.enabled = true;
        }
    }

    onPointerDown(event) {
        if (!this.enabled || event.button !== 0) return; // Only left mouse button or touch, and if enabled

        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        const cradleGroup = this.cradleGroupGetter(); // Get the current cradleGroup
        if (!cradleGroup) return; // Ensure cradleGroup exists

        const intersects = this.raycaster.intersectObjects(cradleGroup.children, true);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            const ballMeshes = cradleGroup.userData.balls;
            this.draggedBallIndex = ballMeshes.findIndex(mesh => mesh === intersectedObject);

            if (this.draggedBallIndex !== -1) {
                this.isDragging = true;
                this.physics.setBallHeld(this.draggedBallIndex, true);
                this.orbitControls.enabled = false; // Disable OrbitControls during drag

                const ball = this.physics.balls[this.draggedBallIndex];
                const L = this.physics.config.threadLength;

                // Set the intersection plane at the ball's current position, facing the camera
                this.intersectionPlane.setFromNormalAndCoplanarPoint(
                    this.camera.getWorldDirection(new THREE.Vector3()),
                    intersectedObject.position
                );

                // Calculate offset from intersection point to ball center
                this.offset.copy(intersectedObject.position).sub(intersects[0].point);

                this.domElement.setPointerCapture(event.pointerId);
            }
        }
    }

    onPointerMove(event) {
        if (!this.enabled || !this.isDragging) return;

        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        const intersection = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.intersectionPlane, intersection);

        if (intersection) {
            const targetPosition = intersection.add(this.offset);
            const ball = this.physics.balls[this.draggedBallIndex];
            const L = this.physics.config.threadLength;

            // Calculate angle from targetPosition relative to pivot
            // Angle is measured from the negative Y axis (straight down)
            const dx = targetPosition.x - ball.pivotX;
            const dy = ball.pivotY - targetPosition.y; // Y is inverted for angle calculation

            // Clamp the distance from pivot to L to avoid stretching the thread
            // The target position should be on the circle of radius L around the pivot
            const distFromPivot = Math.sqrt(dx * dx + dy * dy);
            const ratio = L / Math.max(distFromPivot, 0.001); // Avoid division by zero
            const clampedDx = dx * ratio;
            const clampedDy = dy * ratio;

            const angle = Math.atan2(clampedDx, clampedDy); // atan2(x, y) for angle from -Y axis

            this.physics.setBallAngle(this.draggedBallIndex, angle);
        }
    }

    onPointerUp(event) {
        if (!this.enabled && !this.isDragging) return; // If disabled and not dragging, do nothing
        if (!this.isDragging) return; // Only process if a drag was active

        this.isDragging = false;
        this.physics.setBallHeld(this.draggedBallIndex, false);
        this.orbitControls.enabled = true; // Re-enable OrbitControls
        this.draggedBallIndex = -1;
        this.domElement.releasePointerCapture(event.pointerId);
    }
}