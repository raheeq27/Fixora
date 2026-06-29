import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './config/db.js';
import { runDbMigrations } from './utils/runDbMigrations.js';
import jwt from 'jsonwebtoken';
import { userCanAccessBooking, getBookingParties } from './utils/bookingAccess.js';

import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import { submitContactMessage } from './controllers/contactController.js';
import { URL_ALIASES } from './config/frontendPages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.join(__dirname, 'files (2)');

dotenv.config();
const app = express();
const httpServer = createServer(app);

const isDevOrigin = (origin) =>
    !origin ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

// =========================================
// 1. إعداد الـ Middlewares والـ CORS
// =========================================
app.use(cors({
    origin: (origin, callback) => {
        if (isDevOrigin(origin)) callback(null, true);
        else callback(null, true);
    },
    credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =========================================
// 2. المسارات (Routes) - مرتبة بدون تكرار
// =========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/providers', providerRoutes);

app.post('/api/contact', submitContactMessage);

app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name_ar FROM service_categories ORDER BY name_ar');
        res.json({ success: true, categories: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'فشل في جلب الخدمات' });
    }
});

// روابط مختصرة للحجز: /booking/:id → booking.html?id=...
app.get('/booking/:id', (req, res) => {
    res.redirect(302, `/booking.html?id=${encodeURIComponent(req.params.id)}`);
});

// مسارات منطقية: /client/*, /provider/*, /admin/* → صفحات HTML الفعلية
for (const [zone, aliases] of Object.entries(URL_ALIASES)) {
    for (const [slug, file] of Object.entries(aliases)) {
        app.get(`/${zone}/${slug}`, (req, res) => {
            res.redirect(302, `/${file}`);
        });
    }
}

// الواجهة الأمامية (نفس المنفذ = بدون مشاكل CORS)
app.use(express.static(FRONTEND_DIR));

app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// =========================================
// 3. إعداد الـ Socket.io (الوقت الحقيقي)
// =========================================
const io = new Server(httpServer, {
    cors: {
        origin: (origin, cb) => cb(null, isDevOrigin(origin)),
        methods: ["GET", "POST", "PUT"]
    }
});

io.on('connection', (socket) => {
    console.log('مستخدم جديد اتصل حياً عبر الـ WebSocket 🔌:', socket.id);

    socket.on('join_booking_chat', (bookingId) => {
        if (bookingId) socket.join(String(bookingId));
    });

    socket.on('join_inquiry_chat', (inquiryId) => {
        if (inquiryId) socket.join(`inquiry_${inquiryId}`);
    });

    socket.on('send_new_message', async (data) => {
        try {
            const bookingId = data?.bookingId;
            const text = (data?.message_text || data?.content || '').trim();
            const token = data?.token;
            if (!bookingId || !text || !token) return;

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'fixora_secret_2026'
            );
            const senderId = decoded.userId;
            const allowed = await userCanAccessBooking(senderId, bookingId);
            if (!allowed) return;

            const parties = await getBookingParties(bookingId);
            const receiverId =
                senderId === parties.client_user_id
                    ? parties.provider_user_id
                    : parties.client_user_id;

            const saved = await pool.query(
                `INSERT INTO messages (booking_id, sender_id, receiver_id, content)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [bookingId, senderId, receiverId, text]
            );

            io.to(String(bookingId)).emit('receive_message', saved.rows[0]);
        } catch (err) {
            console.error('Socket message error:', err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('مستخدم قطع الاتصال الحي ❌');
    });
});

// =========================================
// 4. معالج الأخطاء المركزي (Global Error Handler)
// =========================================
app.use((err, req, res, next) => {
    console.error("🚨 Global Error Handler:", err.stack); 
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// =========================================
// 5. تشغيل السيرفر
// =========================================
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    try {
        await pool.query('SELECT 1');
        console.log('Database connection successful');
        await runDbMigrations();
    } catch (e) {
        console.error('Database connection failed:', e.message);
    }
});