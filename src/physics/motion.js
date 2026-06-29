/**
 * @file motion.js
 * @description Handles pendulum swing math, RK4 integration, dual-string tension,
 *              realistic damping (air resistance + viscous friction), and energy tracking.
 *
 * =====================================================================
 *  القسم الأول: الحركة قبل التصادم في بندول نيوتن
 *  المعادلة الحاكمة (من البحث):
 *    d²θ/dt² + (k/m)·ω + (ρ·Cd·A·L / 2m)·ω·|ω| + (g/L)·sin(θ) = 0
 * =====================================================================
 */

import { pendulumBalls } from './state.js';
import { PHYSICS, PENDULUM } from '../constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// الثوابت الفيزيائية الواقعية (من جدول البحث)
// ─────────────────────────────────────────────────────────────────────────────

/** كثافة الهواء عند 20 درجة مئوية (كجم/م³) */
const RHO_AIR = 1.204;

/** معامل السحب للكرة الملساء (بدون وحدة) */
const CD = 0.47;

/** معامل التخميد اللزج الميكانيكي k (N·m·s/rad) — يمكن ضبطه */
const K_DAMPING = 0.002;

// ─────────────────────────────────────────────────────────────────────────────
// الدوال المساعدة الفيزيائية
// ─────────────────────────────────────────────────────────────────────────────

/**
 * حساب المساحة العرضية للكرة: A = π·r²
 * @param {number} radius - نصف قطر الكرة (متر)
 * @returns {number} المساحة (م²)
 */
export function calculateCrossSection(radius) {
    return Math.PI * radius * radius;
}

/**
 * حساب التسارع الزاوي الكامل مع التخميد الواقعي.
 *
 * المعادلة الحاكمة (من البحث):
 *   α = -(g/L)·sin(θ) - (k/m)·ω - (ρ·Cd·A·L / 2m)·ω·|ω|
 *
 * الحد الأول  → قوة الإرجاع الجاذبية
 * الحد الثاني → التخميد اللزج الخطي (احتكاك المحاور + الخيوط)
 * الحد الثالث → مقاومة الهواء التربيعية (السحب الهيدروديناميكي)
 *
 * @param {number} angle    - الزاوية الآنية θ (راديان)
 * @param {number} omega    - السرعة الزاوية ω (راد/ث)
 * @param {number} L        - طول الخيط (متر)
 * @param {number} mass     - كتلة الكرة (كجم)
 * @param {number} radius   - نصف قطر الكرة (متر)
 * @returns {number} التسارع الزاوي α (راد/ث²)
 */
export function calculateAngularAcceleration(angle, omega, L, mass, radius) {
    const g = PHYSICS.GRAVITY;
    const A = calculateCrossSection(radius);

    // الحد الجاذبي
    const gravityTerm   = -(g / L) * Math.sin(angle);

    // الحد الاحتكاكي الخطي: -(k/m)·ω
    const viscousTerm   = -(K_DAMPING / mass) * omega;

    // الحد التربيعي لمقاومة الهواء: -(ρ·Cd·A·L / 2m)·ω·|ω|
    const airDragTerm   = -((RHO_AIR * CD * A * L) / (2 * mass)) * omega * Math.abs(omega);

    return gravityTerm + viscousTerm + airDragTerm;
}

// ─────────────────────────────────────────────────────────────────────────────
// حساب شد الخيطين (من القسم الأول بالبحث)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * حساب شد كل خيط من خيطَي تعليق الكرة.
 *
 * لأن الجهاز يستخدم حبلين متماثلين:
 *   T_total = mg·cos(θ) + mv²/L
 *   T1 = T2 = T_total / 2
 *
 * @param {number} angle    - الزاوية الآنية θ (راديان)
 * @param {number} omega    - السرعة الزاوية ω (راد/ث)
 * @param {number} L        - طول الخيط (متر)
 * @param {number} mass     - كتلة الكرة (كجم)
 * @returns {{ T1: number, T2: number, Ttotal: number }}
 */
export function calculateStringTension(angle, omega, L, mass) {
    const g = PHYSICS.GRAVITY;
    const v = omega * L;                           // السرعة الخطية v = ω·L
    const centripetalTerm = (mass * v * v) / L;   // mv²/L
    const radialWeight    = mass * g * Math.cos(angle); // mg·cos(θ)

    const Ttotal = radialWeight + centripetalTerm;
    const T1     = Ttotal / 2;

    return { T1, T2: T1, Ttotal };
}

// ─────────────────────────────────────────────────────────────────────────────
// حساب السرعة قبل التصادم (مبدأ حفظ الطاقة)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * حساب السرعة الخطية للكرة عند أدنى نقطة (لحظة قبل التصادم).
 *
 * من مبدأ حفظ الطاقة:
 *   mgL(1 - cos θ₀) = ½mv²
 *   v = √(2gL(1 - cos θ₀))
 *
 * @param {number} initialAngle - الزاوية الابتدائية θ₀ (راديان)
 * @param {number} L            - طول الخيط (متر)
 * @returns {number} السرعة الخطية (م/ث)
 */
export function calculateVelocityBeforeCollision(initialAngle, L) {
    const g = PHYSICS.GRAVITY;
    return Math.sqrt(2 * g * L * (1 - Math.cos(initialAngle)));
}

/**
 * حساب السرعة الزاوية الابتدائية من السرعة الخطية: ω = v / L
 *
 * @param {number} initialAngle - الزاوية الابتدائية θ₀ (راديان)
 * @param {number} L            - طول الخيط (متر)
 * @returns {number} السرعة الزاوية (راد/ث)
 */
export function calculateInitialOmega(initialAngle, L) {
    const v = calculateVelocityBeforeCollision(initialAngle, L);
    return v / L;
}

// ─────────────────────────────────────────────────────────────────────────────
// تتبع الطاقة
// ─────────────────────────────────────────────────────────────────────────────

/**
 * حساب الطاقة الحركية: K = ½mv²  →  K = ½m(ωL)²
 *
 * @param {number} omega  - السرعة الزاوية (راد/ث)
 * @param {number} L      - طول الخيط (متر)
 * @param {number} mass   - الكتلة (كجم)
 * @returns {number} الطاقة الحركية (جول)
 */
export function calculateKineticEnergy(omega, L, mass) {
    const v = omega * L;
    return 0.5 * mass * v * v;
}

/**
 * حساب طاقة الوضع: U = mgL(1 - cos θ)
 *
 * @param {number} angle  - الزاوية الآنية θ (راديان)
 * @param {number} L      - طول الخيط (متر)
 * @param {number} mass   - الكتلة (كجم)
 * @returns {number} طاقة الوضع (جول)
 */
export function calculatePotentialEnergy(angle, L, mass) {
    const g = PHYSICS.GRAVITY;
    return mass * g * L * (1 - Math.cos(angle));
}

/**
 * حساب الطاقة الميكانيكية الكلية: E = K + U
 *
 * @param {number} angle  - الزاوية الآنية θ (راديان)
 * @param {number} omega  - السرعة الزاوية (راد/ث)
 * @param {number} L      - طول الخيط (متر)
 * @param {number} mass   - الكتلة (كجم)
 * @returns {{ K: number, U: number, E: number }}
 */
export function calculateMechanicalEnergy(angle, omega, L, mass) {
    const K = calculateKineticEnergy(omega, L, mass);
    const U = calculatePotentialEnergy(angle, L, mass);
    return { K, U, E: K + U };
}

// ─────────────────────────────────────────────────────────────────────────────
// التكامل العددي بطريقة RK4
// ─────────────────────────────────────────────────────────────────────────────

/**
 * خطوة تكامل RK4 لكرة بندول واحدة.
 *
 * تحل المعادلة التفاضلية من الرتبة الثانية بتحويلها إلى نظام من
 * معادلتين من الرتبة الأولى:
 *   dθ/dt = ω
 *   dω/dt = α(θ, ω)
 *
 * @param {number} theta  - الزاوية الحالية θ (راديان)
 * @param {number} omega  - السرعة الزاوية الحالية ω (راد/ث)
 * @param {number} dt     - خطوة الزمن (ثانية)
 * @param {number} L      - طول الخيط (متر)
 * @param {number} mass   - الكتلة (كجم)
 * @param {number} radius - نصف القطر (متر)
 * @returns {{ newTheta: number, newOmega: number }}
 */
function rk4Step(theta, omega, dt, L, mass, radius) {
    const f = (th, om) => calculateAngularAcceleration(th, om, L, mass, radius);

    // K1
    const k1_theta = omega;
    const k1_omega = f(theta, omega);

    // K2
    const k2_theta = omega + 0.5 * dt * k1_omega;
    const k2_omega = f(theta + 0.5 * dt * k1_theta, omega + 0.5 * dt * k1_omega);

    // K3
    const k3_theta = omega + 0.5 * dt * k2_omega;
    const k3_omega = f(theta + 0.5 * dt * k2_theta, omega + 0.5 * dt * k2_omega);

    // K4
    const k4_theta = omega + dt * k3_omega;
    const k4_omega = f(theta + dt * k3_theta, omega + dt * k3_omega);

    const newTheta = theta + (dt / 6) * (k1_theta + 2*k2_theta + 2*k3_theta + k4_theta);
    const newOmega = omega + (dt / 6) * (k1_omega + 2*k2_omega + 2*k3_omega + k4_omega);

    return { newTheta, newOmega };
}

// ─────────────────────────────────────────────────────────────────────────────
// تحديث الإحداثيات الديكارتية
// ─────────────────────────────────────────────────────────────────────────────

/**
 * تحويل الزاوية إلى إحداثيات x/y:
 *   x = pivotX + L·sin(θ)
 *   y = pivotY - L·cos(θ)
 *
 * @param {object} ball        - كائن الكرة
 * @param {number} stringLength - طول الخيط (متر)
 */
export function updateCartesianCoordinates(ball, stringLength) {
    ball.x = ball.pivotX + stringLength * Math.sin(ball.angle);
    ball.y = ball.pivotY - stringLength * Math.cos(ball.angle);
}

// ─────────────────────────────────────────────────────────────────────────────
// الدالة الرئيسية: تحديث جميع الكرات
// ─────────────────────────────────────────────────────────────────────────────

/**
 * يُحدِّث الحالة الفيزيائية لكل كرة بندول بخطوة زمنية dt.
 * يستخدم RK4 للدقة العالية ويتجنب التضخم الوهمي للطاقة.
 *
 * @param {number} dt - خطوة الزمن (ثانية)
 */
export function updateAllPendulums(dt) {
    const L = PENDULUM.DEFAULT_LENGTH;

    pendulumBalls.forEach(ball => {
        // ── RK4 Integration ──────────────────────────────────
        const { newTheta, newOmega } = rk4Step(
            ball.angle,
            ball.velocity,
            dt,
            L,
            ball.mass,
            ball.radius
        );

        ball.angle    = newTheta;
        ball.velocity = newOmega;

        // ── تحديث الموضع الديكارتي ───────────────────────────
        updateCartesianCoordinates(ball, L);

        // ── تخزين بيانات الطاقة والشد للكرة (اختياري للـ UI) ─
        const energy  = calculateMechanicalEnergy(ball.angle, ball.velocity, L, ball.mass);
        const tension = calculateStringTension(ball.angle, ball.velocity, L, ball.mass);

        ball.kineticEnergy    = energy.K;
        ball.potentialEnergy  = energy.U;
        ball.totalEnergy      = energy.E;
        ball.stringTension    = tension.T1; // شد كل خيط من الخيطين
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// دوال مساعدة إضافية (للاستخدام من الخارج أو لضبط النظام)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * التردد الزاوي الطبيعي للبندول (تقريب الزوايا الصغيرة):
 *   ω₀ = √(g / L)
 *
 * @param {number} L - طول الخيط (متر)
 * @returns {number} التردد الزاوي (راد/ث)
 */
export function naturalFrequency(L) {
    return Math.sqrt(PHYSICS.GRAVITY / L);
}

/**
 * زمن الدورة الكاملة للبندول:
 *   T = 2π√(L / g)
 *
 * @param {number} L - طول الخيط (متر)
 * @returns {number} زمن الدورة (ثانية)
 */
export function periodOfOscillation(L) {
    return 2 * Math.PI * Math.sqrt(L / PHYSICS.GRAVITY);
}

/**
 * (دالة متوافقة مع الكود القديم - لا تُستخدم داخلياً)
 * تحسب التسارع الزاوي بدون تخميد (النموذج المثالي فقط).
 */
export function applyDamping(velocity) {
    // محتفظ بها للتوافق مع باقي الملفات — التخميد الحقيقي داخل RK4
    return velocity * PHYSICS.AIR_DAMPING;
}
