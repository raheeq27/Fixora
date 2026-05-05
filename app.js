import express from 'express';
import dotenv from 'dotenv';
import pool from './config/db.js';
import userRoutes from './routes/userRoutes.js';
// تفعيل قراءة ملف الـ .env
dotenv.config();

const app = express();

// السماح للسيرفر بفهم بيانات الـ JSON
app.use(express.json());

// رسالة بسيطة تظهر عند فتح السيرفر في المتصفح
app.get('/', (req, res) => {
    res.send('Welcome to Fixora API!');
});

// تحديد المنفذ (Port) من ملف .env
const PORT = process.env.PORT || 3000;

app.use('/api/users', userRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});