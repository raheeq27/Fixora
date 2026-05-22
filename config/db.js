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
import dotenv from 'dotenv';

// تفعيل قراءة متغيرات البيئة من ملف .env
dotenv.config();

const { Pool } = pg;

// إعداد الاتصال باستخدام متغيرات البيئة لضمان السرية التامة
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    
    // إعدادات أداء حوض الاتصالات (Pool Configuration)
    max: 20,                  // الحد الأقصى للاتصالات المتزامنة
    idleTimeoutMillis: 30000, // إغلاق الاتصال تلقائياً إذا ظل خاملاً لـ 30 ثانية
    connectionTimeoutMillis: 2000, // وقت الانتظار قبل فشل الاتصال الجديد
});

// اختبار الاتصال الأولي للتأكد من أن البيانات تعمل بنجاح
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ فشل الاتصال بقاعدة بيانات Fixora:', err.stack);
    }
    console.log('✅ Connected to Fixora database successfully');
    release(); // تحرير الاتصال وإعادته للحوض
});

export default pool;