import pool from '../config/db.js';

const MIGRATIONS = [
  `CREATE OR REPLACE FUNCTION update_modified_column()
   RETURNS TRIGGER AS $$
   BEGIN
     IF EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = TG_TABLE_SCHEMA
         AND table_name = TG_TABLE_NAME
         AND column_name = 'updated_at'
     ) THEN
       NEW.updated_at := NOW();
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql`,
  `ALTER TABLE provider_profiles
   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE users
   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE client_profiles
   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE provider_services
   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE service_categories
   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE bookings
   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE reviews
   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE messages
   ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`,
  `ALTER TABLE provider_profiles
   ADD COLUMN IF NOT EXISTS portfolio_json JSONB DEFAULT '[]'::jsonb`,
  `ALTER TABLE provider_profiles
   ADD COLUMN IF NOT EXISTS serviced_areas_text TEXT`,
  `INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, is_available)
   SELECT pp.id, d.day::day_of_week_enum, d.start_t::TIME, d.end_t::TIME, TRUE
   FROM provider_profiles pp
   CROSS JOIN (VALUES
     ('sun', '09:00', '17:00'),
     ('mon', '09:00', '17:00'),
     ('tue', '09:00', '17:00'),
     ('wed', '09:00', '17:00'),
     ('thu', '09:00', '17:00'),
     ('sat', '10:00', '14:00')
   ) AS d(day, start_t, end_t)
   WHERE NOT EXISTS (
     SELECT 1 FROM provider_availability pa WHERE pa.provider_id = pp.id
   )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE`,
  `CREATE TABLE IF NOT EXISTS user_reports (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
     booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
     reason TEXT NOT NULL,
     status VARCHAR(20) DEFAULT 'pending',
     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
   )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
     ON notifications (user_id, is_read) WHERE is_read = FALSE`,
  `CREATE TABLE IF NOT EXISTS inquiry_threads (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
     provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
     UNIQUE (client_id, provider_id)
   )`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS inquiry_id UUID REFERENCES inquiry_threads(id) ON DELETE CASCADE`,
  `CREATE TABLE IF NOT EXISTS contact_messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     full_name VARCHAR(120) NOT NULL,
     phone VARCHAR(20) NOT NULL,
     email VARCHAR(120),
     topic VARCHAR(80) NOT NULL DEFAULT 'استفسار عام',
     message TEXT NOT NULL,
     status VARCHAR(20) DEFAULT 'new',
     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
   )`
];

export async function runDbMigrations() {
  for (const sql of MIGRATIONS) {
    await pool.query(sql);
  }
}
