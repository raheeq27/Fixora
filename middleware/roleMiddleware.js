// ميدل وير لتحديد من يمكنه الوصول للمسار بناءً على الرتبة (admin, provider, client)
export const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            const error = new Error('ليس لديك الصلاحية الكافية للقيام بهذا الإجراء');
            error.statusCode = 403; // Forbidden
            return next(error);
        }
        next();
    };
};