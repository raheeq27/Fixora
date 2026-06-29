import { requireRole } from './roleMiddleware.js';

/** يتحقق من role === 'admin' — استخدم بعد authMiddleware */
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'صلاحية الأدمن مطلوبة.',
      yourRole: req.user?.role || null
    });
  }
  next();
};

const adminMiddleware = requireRole('admin');

export default adminMiddleware;
