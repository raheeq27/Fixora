-- فهارس البحث الجغرافي والتقييم (آمن للتشغيل المتكرر)
CREATE INDEX IF NOT EXISTS idx_users_governorate ON users (governorate);
CREATE INDEX IF NOT EXISTS idx_provider_areas_governorate ON provider_areas (governorate);
CREATE INDEX IF NOT EXISTS idx_provider_areas_provider ON provider_areas (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_avg_rating ON provider_profiles (avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_specialty ON provider_profiles (specialty);
CREATE INDEX IF NOT EXISTS idx_provider_availability_lookup
  ON provider_availability (provider_id, day_of_week, is_available);
