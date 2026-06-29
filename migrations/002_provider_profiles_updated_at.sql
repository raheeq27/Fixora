-- إصلاح: trigger update_modified_column يتطلب عمود updated_at
ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
