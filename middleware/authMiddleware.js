// import jwt from 'jsonwebtoken';

// const authMiddleware = (req, res, next) => {
//     const authHeader = req.header('Authorization');

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'لا يوجد توكن، الوصول ممنوع!' });
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded; // هون بنخزن بيانات المستخدم عشان الكنترولر يشوفها
//         next();
//     } catch (err) {
//         res.status(401).json({ message: 'التوكن غير صالح!' });
//     }
// }

// export default authMiddleware;



import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log("الهيدر الذي وصل للسيرفر هو:", authHeader); // هذا السطر هو مفتاح الحل
    // سطر فحص فائق الأهمية لمعرفة ماذا يرسل المتصفح فعلياً
    console.log("🔍 كل الهيدرز الواصلة للسيرفر:", req.headers);

    if (!authHeader) {
        console.log("لا يوجد Header باسم Authorization!");
        return res.status(401).json({ message: 'لا يوجد Header باسم Authorization!' });
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'الـ Header لا يبدأ بكلمة Bearer' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, 'fixora_secret_2026'); // الـ Secret الثابت
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'التوكن غير صالح!' });
    }
}

export default authMiddleware;