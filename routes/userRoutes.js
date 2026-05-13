// import express from 'express';
// import { registerUser, getAllUsers, loginUser } from '../controllers/userController.js';
// import { protect } from '../middleware/authMiddleware.js';

// // داخل routes/userRoutes.js شغل جمالات
// import { registerUser, loginUser, getAllUsers, createBooking } from '../controllers/userController.js';
// const router = express.Router();

// router.post('/register', registerUser);
// router.post('/login', loginUser);

// router.get('/', protect, getAllUsers);
// export default router;


// // ... الراوتس القديمة ... جمالات// مسار الحجوزات الجديد
// router.post('/bookings', createBooking); 

// export default router; // إضافة هذا السطر

import express from 'express';
// استيراد جميع الدوال من الـ Controller بما فيها دالة الحجوزات الخاصة بكِ
import { 
    registerUser, 
    loginUser, 
    getAllUsers, 
    createBooking 
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. مسارات الحسابات (شغل مشترك)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', protect, getAllUsers);

// 2. مسار الحجوزات (شغل جمالات - مدمج ومنظم)
router.post('/bookings', createBooking); 

// تصدير الراوتر مرة واحدة فقط في نهاية الملف
export default router;