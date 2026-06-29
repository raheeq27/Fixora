-- يمنع خطأ: record "new" has no field "updated_at" عند غياب العمود
CREATE OR REPLACE FUNCTION update_modified_column()
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
$$ LANGUAGE plpgsql;

ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
