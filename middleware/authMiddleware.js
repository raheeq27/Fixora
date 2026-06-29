import jwt from 'jsonwebtoken';
export { requireRole, restrictTo } from './roleMiddleware.js';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'لا يوجد توكن!' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fixora_secret_2026');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'التوكن غير صالح!' });
    }
};

export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'صلاحية مرفوضة.' });
    }
    next();
};