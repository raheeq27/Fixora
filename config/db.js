// import pg from 'pg';
// import dotenv from 'dotenv';

// dotenv.config();

// const pool = new pg.Pool({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
// });
// export default pool;
import pg from 'pg';
const { Pool } = pg;

// 1. البيانات مخزنة هنا مباشرة لتسهيل التعديل
const pool = new Pool({
    user: 'postgres',           // اسم المستخدم
    host: 'localhost',          // المستضيف
    database: 'fixora_db',      // اسم قاعدة البيانات
    password: 'postgres123',    // عدلي كلمة المرور هنا واجعليها بين ''
    port: 5432,                 // المنفذ
});

export default pool;