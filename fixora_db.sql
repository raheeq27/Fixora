-- =========================================
-- EXTENSIONS
-- =========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- ENUM TYPES
-- =========================================

CREATE TYPE user_role AS ENUM (
    'client',
    'provider',
    'admin'
);

CREATE TYPE booking_status AS ENUM (
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'rejected'
);

CREATE TYPE notification_type AS ENUM (
    'booking_update',
    'new_review',
    'payment',
    'system_alert',
    'favorite_action'
);

CREATE TYPE jordan_governorates AS ENUM (
    'Amman',
    'Irbid',
    'Zarqa',
    'Aqaba',
    'Madaba',
    'Mafraq',
    'Balqa',
    'Karak',
    'Tafileh',
    'Ma''an',
    'Ajloun',
    'Jerash',
    'Salat'
);

CREATE TYPE day_of_week_enum AS ENUM (
    'sat',
    'sun',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri'
);

-- =========================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- USERS
-- =========================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    email VARCHAR(255) NOT NULL UNIQUE,

    phone VARCHAR(15) NOT NULL UNIQUE,

    role user_role NOT NULL,

    password_hash TEXT NOT NULL,

    governorate jordan_governorates ,

    first_name TEXT,
    last_name TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CLIENT PROFILES
-- =========================================

CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL UNIQUE,

    address TEXT,
    profile_pic_url TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_client_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================
-- PROVIDER PROFILES
-- =========================================

CREATE TABLE provider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL UNIQUE,

    specialty VARCHAR(100),

    bio TEXT,

    experience_years INTEGER DEFAULT 0,

    profile_pic_url TEXT,

    is_verified BOOLEAN DEFAULT FALSE,

    avg_rating NUMERIC(3,2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_provider_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================
-- SERVICE CATEGORIES
-- =========================================

CREATE TABLE service_categories (
    id SERIAL PRIMARY KEY,

    name_ar VARCHAR(255) NOT NULL UNIQUE,

    icon TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- PROVIDER SERVICES
-- =========================================

CREATE TABLE provider_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    provider_id UUID NOT NULL,

    category_id INTEGER NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_provider_service_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_provider_service_category
        FOREIGN KEY (category_id)
        REFERENCES service_categories(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_provider_category
        UNIQUE(provider_id, category_id)
);

-- =========================================
-- BOOKINGS
-- =========================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    client_id UUID NOT NULL,

    provider_id UUID NOT NULL,

    category_id INTEGER NOT NULL,

    status booking_status DEFAULT 'pending',

    scheduled_at TIMESTAMPTZ NOT NULL,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_client
        FOREIGN KEY (client_id)
        REFERENCES client_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_category
        FOREIGN KEY (category_id)
        REFERENCES service_categories(id)
);

-- =========================================
-- FAVORITES
-- =========================================

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    client_id UUID NOT NULL,

    provider_id UUID NOT NULL,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_favorite_client
        FOREIGN KEY (client_id)
        REFERENCES client_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_favorite_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_favorite
        UNIQUE(client_id, provider_id)
);

-- =========================================
-- REVIEWS
-- =========================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID NOT NULL UNIQUE,

    client_id UUID NOT NULL,

    provider_id UUID NOT NULL,

    rating SMALLINT NOT NULL,

    comment TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_rating
        CHECK (rating >= 1 AND rating <= 5),

    CONSTRAINT fk_review_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_client
        FOREIGN KEY (client_id)
        REFERENCES client_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE
);

-- =========================================
-- NOTIFICATIONS
-- =========================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL,

    type notification_type NOT NULL,

    message TEXT NOT NULL,
    
    title VARCHAR(100) NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================
-- MESSAGES
-- =========================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sender_id UUID NOT NULL,

    receiver_id UUID NOT NULL,

    booking_id UUID,

    content TEXT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_message_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_message_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_message_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE SET NULL
);

-- =========================================
-- PROVIDER AREAS
-- =========================================

CREATE TABLE provider_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider_id UUID NOT NULL,

    governorate jordan_governorates NOT NULL,

    district VARCHAR(100),

    is_primary BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_area_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE
);

-- =========================================
-- PROVIDER AVAILABILITY
-- =========================================

CREATE TABLE provider_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider_id UUID NOT NULL,

    day_of_week day_of_week_enum NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    is_available BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_availability_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT check_valid_time
        CHECK (end_time > start_time)
);

-- =========================================
-- PROVIDER DOCUMENTS
-- =========================================

CREATE TABLE provider_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider_id UUID NOT NULL,

    doc_type VARCHAR(50),

    file_url TEXT NOT NULL,

    is_approved BOOLEAN DEFAULT FALSE,

    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_provider
        FOREIGN KEY (provider_id)
        REFERENCES provider_profiles(id)
        ON DELETE CASCADE
);

-- =========================================
-- ADMINS
-- =========================================

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    permissions JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================
-- UPDATED_AT TRIGGERS
-- =========================================

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_client_profiles_updated
BEFORE UPDATE ON client_profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_provider_profiles_updated
BEFORE UPDATE ON provider_profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_service_categories_updated
BEFORE UPDATE ON service_categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_provider_services_updated
BEFORE UPDATE ON provider_services
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_bookings_updated
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_reviews_updated
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_messages_updated
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- =========================================
-- PROVIDER RATING FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_provider UUID;
BEGIN

    IF TG_OP = 'DELETE' THEN
        target_provider := OLD.provider_id;
    ELSE
        target_provider := NEW.provider_id;
    END IF;

    UPDATE provider_profiles
    SET avg_rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM reviews
        WHERE provider_id = target_provider
    ), 0)
    WHERE id = target_provider;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;

END;
$$ LANGUAGE plpgsql;

-- =========================================
-- PROVIDER RATING TRIGGER
-- =========================================

CREATE TRIGGER trg_update_provider_rating
AFTER INSERT OR UPDATE OR DELETE
ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_provider_rating();