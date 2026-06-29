/**
 * Role-based API protection (RequireRole / restrictTo).
 * Use after authMiddleware so req.user is set from JWT.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك الصلاحية للوصول إلى هذا المورد.',
        requiredRoles: allowedRoles,
        yourRole: req.user?.role || null
      });
    }
    next();
  };
};

/** @deprecated use requireRole — kept for existing imports */
export const restrictTo = requireRole;
