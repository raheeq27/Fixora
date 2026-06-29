CREATE TABLE IF NOT EXISTS inquiry_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, provider_id)
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS inquiry_id UUID REFERENCES inquiry_threads(id) ON DELETE CASCADE;
