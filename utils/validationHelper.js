/**
 * 1. التحقق من صحة صيغة الـ UUIDv4
 * يُستخدم للـ user_id, provider_id, client_id, booking_id
 */
export const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * 2. التحقق من الأرقام التسلسلية (Integer/Serial)
 * يُستخدم خصيصاً للـ category_id والـ service_id بناءً على مخطط قاعدة البيانات
 */
export const isValidInteger = (id) => {
    // نتأكد أن القيمة عبارة عن رقم صحيح وموجب وأكبر من صفر
    const num = Number(id);
    return Number.isInteger(num) && num > 0;
};

/**
 * 3. التحقق من صحة البريد الإلكتروني
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * 4. التحقق من رقم الهاتف الأردني
 * يدعم الصيغ التي تبدأ بـ 07 أو المسبوقة بمفتاح الدولة +962
 */
export const isValidJordanianPhone = (phone) => {
    const phoneRegex = /^(07[789]\d{7}|\+9627[789]\d{7})$/;
    return phoneRegex.test(phone);
};