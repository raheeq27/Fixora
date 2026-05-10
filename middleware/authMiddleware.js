import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);


            req.user = decoded;

        } catch (error) {
            res.status(401).json({ success: false, message: 'رمز الدخول غير صحيح أو انتهت صلاحيته.' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'فشل التحقق، يرجى تسجيل الدخول أولاً.' });
    }
};