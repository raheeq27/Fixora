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

// export default router; // إضافة هذا السطرimport express from 'express';import express from 'express'; // تأكدي أن هذا السطر غير معلق
import express from 'express'; // السطر الناقص الذي يسبب توقف السيرفر
import { 
    registerUser, 
    loginUser, 
    getAllUsers, 
    createBooking,
    getUserBookings 
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. مسارات الحسابات (شغل البنات)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', protect, getAllUsers);

// 2. مسارات الحجوزات (شغل جمالات)
router.post('/bookings', createBooking); // لإضافة حجز جديد
router.get('/user/:userId', getUserBookings); // لجلب حجوزات مستخدم معين لعرضها في لوحة التحكم

export default router;