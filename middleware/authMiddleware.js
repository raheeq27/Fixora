import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'لا يوجد توكن، الوصول ممنوع!' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // هون بنخزن بيانات المستخدم عشان الكنترولر يشوفها
        next();
    } catch (err) {
        res.status(401).json({ message: 'التوكن غير صالح!' });
    }
}

export default authMiddleware;