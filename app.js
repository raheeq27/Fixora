import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http'; // 👈 مطلوب لربط الـ Socket.io بالسيرفر
import { Server } from 'socket.io'; // 👈 حزمة الاتصال الحي بالوقت الحقيقي
import pool from './config/db.js';

// استيراد المسارات (Routes)
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js'; // 👈 تم إضافة ملف التفاعلات (Task 5)
import adminRoutes from './routes/adminRoutes.js'; // 👈 تم إضافة ملف الأدمن

dotenv.config();
const app = express();
const httpServer = createServer(app); // 👈 إنشاء سيرفر HTTP يدمج Express

// =========================================
// 1. إعداد الـ Middlewares والـ CORS
// =========================================
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // روابط الـ Frontend أثناء التطوير
    credentials: true
})); 
app.use(express.json());

// =========================================
// 2. إعداد الـ Socket.io (الوقت الحقيقي للشات)
// =========================================
const io = new Server(httpServer, {
    cors: {
        origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
        methods: ["GET", "POST", "PUT"]
    }
});

io.on('connection', (socket) => {
    console.log('مستخدم جديد اتصل حياً عبر الـ WebSocket 🔌:', socket.id);

    // غرف الشات السياقية بناءً على رقم الحجز (Booking ID)
    socket.on('join_booking_chat', (bookingId) => {
        socket.join(bookingId);
        console.log(`المستخدم دخل الغرفة السياقية للحجز: ${bookingId}`);
    });

    // الاستماع للرسائل الحية وإعادة بثها للطرف الآخر في نفس الغرفة
    socket.on('send_new_message', (data) => {
        // data تحتوي على: { bookingId, sender_name, message_text }
        socket.to(data.bookingId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('مستخدم قطع الاتصال الحي ❌');
    });
});

// =========================================
// 3. تفعيل المسارات الأساسية للـ API
// =========================================
app.use('/api/auth', authRoutes); // إدارة التوثيق، التسجيل وتعديل الحسابات
app.use('/api/users', userRoutes); // إدارة عمليات البحث، الفلاتر والحجوزات
app.use('/api/interactions', interactionRoutes); // إدارة الرسائل، التقييمات والمفضلة (Task 5)
app.use('/api/admin', adminRoutes); // لوحة التحكم وتوثيق الفنيين الجدد

// مسار اختباري للتأكد من تشغيل الباكند
app.get('/', (req, res) => {
    res.send('Fixora المطور وجاهز لربط الفرونتند! 🚀');
});

// =========================================
// 4. معالج الأخطاء المركزي (Global Error Handler)
// =========================================
app.use((err, req, res, next) => {
    console.error(err.stack); 
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// =========================================
// 5. تشغيل السيرفر المدمج على بورت 3000
// =========================================
const PORT = process.env.PORT || 3000; // 👈 تم إرجاعه إلى بورت 3000 بناءً على طلبك
httpServer.listen(PORT, () => {
    console.log( `Server is running on port : ${PORT} 🚀`);
});