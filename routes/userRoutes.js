
// import express from 'express';
// import { 
//     registerUser, 
//     loginUser, 
//     getAllUsers, 
//     createBooking,
//     getUserBookings 
// } from '../controllers/userController.js';

// const router = express.Router();

// router.get('/test', (req, res) => {
//     res.send("السيرفر يعمل والمسار مربوط بنجاح!");
// });
// router.post('/register', (req, res) => {
//     console.log("✅ وصلت البيانات للمسار الصحيح!");
//     res.status(200).json({ message: "تم الوصول بنجاح!" });
// });
// // مسارات الحسابات
// router.post('/register', registerUser);
// router.post('/login', loginUser);

// // مسارات الحجوزات (شغل جمالات)
// router.post('/bookings', createBooking);
// router.get('/user/:userId', getUserBookings);

// export default router;


import express from 'express';

// استيراد دوال المستخدمين من الملف القديم
import { 
    registerUser, 
    loginUser, 
    getAllUsers 
} from '../controllers/userController.js';

// استيراد دوال الحجز من الملف الجديد
import { 
    createBooking, 
    getUserBookings 
} from '../controllers/bookingController.js'; // تأكدي أن الملف موجود فعلاً في مجلد controllers
import express from 'express';
import { getAllUsers } from '../controllers/userController.js';

const router = express.Router();

// ... باقي الكود ...
// مسارات الحسابات
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/all', getAllUsers);

// مسارات الحجوزات (تأكدي من استخدام الدوال المستوردة من bookingController)
router.post('/bookings', createBooking);
router.get('/user/:userId', getUserBookings);
router.get('/', getAllUsers);

export default router;