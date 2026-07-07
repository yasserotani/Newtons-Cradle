
    import { pendulumBalls } from "./state.js";
    import { PHYSICS, CONFIG } from "../constants.js";

    const RHO_AIR = 1.204;
    const CD = 0.47;

    // Calculates the circular cross-sectional area of a ball.
    export function calculateCrossSection(radius) {
        return Math.PI * radius * radius;
    }

    // Calculates the angular acceleration of a pendulum ball, considering gravity, viscous damping, and air drag.
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

    // Performs a single step of the Runge-Kutta 4th order integration for angular motion.
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

    // ── Energy tracking (paper page 20: K = ½mv², U = mgL(1-cosθ), E = K+U) ──
    // v = ω·L (paper page 5, "الحركة الخطية والزاوية")

    // Calculates the kinetic energy of a ball.
    export function calculateKineticEnergy(omega, L, mass) {
        const v = omega * L;
        return 0.5 * mass * v * v;
    }

    // Calculates the potential energy of a ball.
    export function calculatePotentialEnergy(angle, L, mass) {
        const g = CONFIG.gravity; // FIX: was PHYSICS.GRAVITY
        return mass * g * L * (1 - Math.cos(angle));
    }

    // Calculates the kinetic, potential, and total mechanical energy of a ball.
    export function calculateMechanicalEnergy(angle, omega, L, mass) {
        const K = calculateKineticEnergy(omega, L, mass);
        const U = calculatePotentialEnergy(angle, L, mass);
        return { K, U, E: K + U };
    }


    export function getTotalSystemEnergy() {
        const L = CONFIG.threadLength;
        return pendulumBalls.reduce(
            (totals, ball) => {
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

    export function updateAllPendulums(dt, infiniteMotion) {
        const L = CONFIG.threadLength;

        pendulumBalls.forEach((ball) => {
            if (!ball.held) {
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


            ball.updateCartesianCoordinates(L);

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