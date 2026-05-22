import pg from 'pg';
const { Pool } = pg;

// 1. البيانات مخزنة هنا مباشرة لتسهيل التعديل
const pool = new Pool({
    user: 'postgres',           // اسم المستخدم
    host: 'localhost',          // المستضيف
    database: 'fixora_db',      // اسم قاعدة البيانات
    password: '1234',    // عدلي كلمة المرور هنا واجعليها بين ''
    port: 5432,                 // المنفذ
});

export default pool;