    // src/physics/motion.js
    // Pendulum swing physics: RK4 integration with air drag + viscous damping.

    import { pendulumBalls } from "./state.js";
    import { PHYSICS, CONFIG } from "../constants.js";

    const RHO_AIR = 1.204;
    const CD = 0.47;

    export function calculateCrossSection(radius) {
        return Math.PI * radius * radius;
    }

    export function calculateAngularAcceleration(angle, omega, L, mass, radius, infiniteMotion) {
        const g = CONFIG.gravity; // FIX: was PHYSICS.GRAVITY, a frozen constant the gravity slider never touched
        const A = calculateCrossSection(radius);

        const gravityTerm = -(g / L) * Math.sin(angle);
        let viscousTerm = -(PHYSICS.VISCOUS_K / mass) * omega;
        let airDragTerm =
            -((RHO_AIR * CD * A * L) / (2 * mass)) * omega * Math.abs(omega);

        if (infiniteMotion) {
            viscousTerm = 0;
            airDragTerm = 0;
        }

        return gravityTerm + viscousTerm + airDragTerm;
    }

    function rk4Step(theta, omega, dt, L, mass, radius, infiniteMotion) {
        const f = (th, om) => calculateAngularAcceleration(th, om, L, mass, radius, infiniteMotion);

        const k1_theta = omega;
        const k1_omega = f(theta, omega);

        const k2_theta = omega + 0.5 * dt * k1_omega;
        const k2_omega = f(theta + 0.5 * dt * k1_theta, omega + 0.5 * dt * k1_omega);

        const k3_theta = omega + 0.5 * dt * k2_omega;
        const k3_omega = f(theta + 0.5 * dt * k2_theta, omega + 0.5 * dt * k2_omega);

        const k4_theta = omega + dt * k3_omega;
        const k4_omega = f(theta + dt * k3_theta, omega + dt * k3_omega);

        const newTheta =
            theta + (dt / 6) * (k1_theta + 2 * k2_theta + 2 * k3_theta + k4_theta);
        const newOmega =
            omega + (dt / 6) * (k1_omega + 2 * k2_omega + 2 * k3_omega + k4_omega);

        return { newTheta, newOmega };
    }

    export function updateCartesianCoordinates(ball, stringLength) {
        ball.x = ball.pivotX + stringLength * Math.sin(ball.angle);
        ball.y = ball.pivotY - stringLength * Math.cos(ball.angle);
    }

    // ── Energy tracking (paper page 20: K = ½mv², U = mgL(1-cosθ), E = K+U) ──
    // v = ω·L (paper page 5, "الحركة الخطية والزاوية")

    export function calculateKineticEnergy(omega, L, mass) {
        const v = omega * L;
        return 0.5 * mass * v * v;
    }

    export function calculatePotentialEnergy(angle, L, mass) {
        const g = CONFIG.gravity; // FIX: was PHYSICS.GRAVITY
        return mass * g * L * (1 - Math.cos(angle));
    }

    export function calculateMechanicalEnergy(angle, omega, L, mass) {
        const K = calculateKineticEnergy(omega, L, mass);
        const U = calculatePotentialEnergy(angle, L, mass);
        return { K, U, E: K + U };
    }

    /**
     * Sums kinetic, potential, and total mechanical energy across all balls
     * right now. The split (not just the merged total) is useful because the
     * paper's section 6 specifically describes K and U trading off against
     * each other during a swing, while their sum E trends downward over time.
     */
    export function getTotalSystemEnergy() {
        const L = CONFIG.threadLength;
        return pendulumBalls.reduce(
            (totals, ball) => {
                // Skip energy calculation for held balls, as their state is externally controlled
                if (ball.held) {
                    return totals;
                }
                const { K, U, E } = calculateMechanicalEnergy(
                    ball.angle,
                    ball.velocity,
                    L,
                    ball.mass,
                );
                totals.K += K;
                totals.U += U;
                totals.E += E;
                return totals;
            },
            { K: 0, U: 0, E: 0 },
        );
    }

    /**
     * Integrates every ball's swing by dt using RK4.
     * Does NOT handle collisions — that's collision.js's job, called after this.
     */
    export function updateAllPendulums(dt, infiniteMotion) {
        const L = CONFIG.threadLength;

        pendulumBalls.forEach((ball) => {
            if (!ball.held) {
                // Only integrate if the ball is NOT held
                const { newTheta, newOmega } = rk4Step(
                    ball.angle,
                    ball.velocity,
                    dt,
                    L,
                    ball.mass,
                    ball.radius,
                    infiniteMotion,
                );

                ball.angle = newTheta;
                ball.velocity = newOmega;
            } else {
                // If held, ensure velocity is zeroed out
                ball.velocity = 0;
            }

            // Always update Cartesian coordinates, even for held balls,
            // so their visual position matches their angle (set by drag handler)
            updateCartesianCoordinates(ball, L);

            // Store per-ball energy too, in case the UI wants to show it per-ball
            if (!ball.held) {
                const energy = calculateMechanicalEnergy(ball.angle, ball.velocity, L, ball.mass);
                ball.kineticEnergy = energy.K;
                ball.potentialEnergy = energy.U;
                ball.totalEnergy = energy.E;
            } else {
                ball.kineticEnergy = 0;
                ball.potentialEnergy = 0;
                ball.totalEnergy = 0;
            }
        });
    }

    export function naturalFrequency(L) {
        return Math.sqrt(CONFIG.gravity / L); // FIX: was PHYSICS.GRAVITY
    }

    export function periodOfOscillation(L) {
        return 2 * Math.PI * Math.sqrt(L / CONFIG.gravity); // FIX: was PHYSICS.GRAVITY
    }