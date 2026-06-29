-- بيانات أولية لـ Fixora (شغّل بعد fixora_db.sql)
INSERT INTO service_categories (name_ar) VALUES
  ('تكييف وتبريد'),
  ('كهرباء منزلية'),
  ('سباكة'),
  ('نجارة'),
  ('دهانات'),
  ('أجهزة منزلية'),
  ('تنظيف')
ON CONFLICT (name_ar) DO NOTHING;

-- ترقية مستخدم موجود إلى أدمن (نفّذ يدوياً بعد إنشاء الحساب):
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin@example.com';
