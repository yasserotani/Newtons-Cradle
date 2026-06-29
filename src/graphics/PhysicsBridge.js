// src/graphics/PhysicsBridge.js
/**
 * هذا الملف هو الواجهة الرسمية التي سيتعامل معها فريق الفيزياء.
 * مهمته: استقبال إحداثيات الكرات من الفيزياء وتحديث الجرافيكس.
 */
export default class PhysicsBridge {
    constructor(updater) {
        this.updater = updater;
        this.isReady = true;
        console.log('✅ PhysicsBridge جاهز لاستقبال بيانات الفيزياء');
    }

    /**
     * الدالة التي سيناديها فريق الفيزياء في كل إطار
     * @param {Array} positions - مصفوفة تحتوي على {x, y, z} لكل كرة
     * @returns {boolean} - تعيد true إذا تم التحديث بنجاح
     */
    updateBalls(positions) {
        if (!this.updater) {
            console.warn('⚠️ الـ Updater غير موجود');
            return false;
        }

        // تحقق بسيط من صحة البيانات (عدد الكرات)
        const expectedCount = this.updater.balls?.length || 0;
        if (!positions || positions.length !== expectedCount) {
            console.warn(`⚠️ عدد الإحداثيات المستلمة (${positions?.length || 0}) لا يتطابق مع عدد الكرات (${expectedCount})`);
            return false;
        }

        // تمرير البيانات إلى الـ Updater الخاص بالجرافيكس
        this.updater.updateBalls(positions);
        return true;
    }

    /**
     * دالة مساعدة لفريق الفيزياء للحصول على عدد الكرات (للتأكد من التطابق)
     */
    getBallCount() {
        return this.updater.balls?.length || 0;
    }
}