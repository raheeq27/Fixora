--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

-- Started on 2026-05-08 23:12:49

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 16658)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 3559 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 16435)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3560 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 903 (class 1247 OID 16452)
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status AS ENUM (
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'rejected'
);


ALTER TYPE public.booking_status OWNER TO postgres;

--
-- TOC entry 939 (class 1247 OID 16696)
-- Name: jordan_governorates; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.jordan_governorates AS ENUM (
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
    'Jerash'
);


ALTER TYPE public.jordan_governorates OWNER TO postgres;

--
-- TOC entry 924 (class 1247 OID 16575)
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'booking_update',
    'new_review',
    'payment',
    'system_alert',
    'favorite_action'
);


ALTER TYPE public.notification_type OWNER TO postgres;

CREATE TYPE public.day_of_week_enum AS ENUM (
    'sat',
    'sun',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri'
);


ALTER TYPE public.day_of_week_enum OWNER TO postgres;



CREATE TYPE public.user_role AS ENUM (
    'client',
    'provider',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 241 (class 1255 OID 16475)
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN 
	NEW.updated_at = now();
	RETURN NEW;
END;
	$$;


ALTER FUNCTION public.update_modified_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16641)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16547)
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    category_id integer NOT NULL,
    status public.booking_status DEFAULT 'pending'::public.booking_status,
    scheduled_at timestamp with time zone NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16477)
-- Name: client_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    address text,
    profile_pic_url text
);


ALTER TABLE public.client_profiles OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16600)
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16745)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    booking_id uuid,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16585)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16721)
-- Name: provider_areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_areas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    governorate public.jordan_governorates NOT NULL,
    district character varying(100),
    is_primary boolean DEFAULT false
);


ALTER TABLE public.provider_areas OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16733)
-- Name: provider_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    day_of_week public.day_of_week_enum NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true
);


ALTER TABLE public.provider_availability OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16770)
-- Name: provider_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    doc_type character varying(50),
    file_url text NOT NULL,
    is_approved boolean DEFAULT false,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.provider_documents OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16492)
-- Name: provider_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    specialty character varying(100),
    is_verified boolean DEFAULT false,
    bio text,
    avg_rating numeric(3,2) DEFAULT 0,
    profile_pic_url text,
    experience_years integer
);


ALTER TABLE public.provider_profiles OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16528)
-- Name: provider_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    provider_id uuid NOT NULL,
    category_id integer NOT NULL,
    description text
);


ALTER TABLE public.provider_services OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16619)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    rating smallint NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    client_id uuid,
    CONSTRAINT check_rating CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16514)
-- Name: service_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_categories (
    id integer NOT NULL,
    name_ar character varying(255) NOT NULL,
    icon text,
    is_active boolean DEFAULT true
);


ALTER TABLE public.service_categories OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16513)
-- Name: service_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.service_categories_id_seq OWNER TO postgres;

--
-- TOC entry 3561 (class 0 OID 0)
-- Dependencies: 219
-- Name: service_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_categories_id_seq OWNED BY public.service_categories.id;


--
-- TOC entry 216 (class 1259 OID 16461)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(10) NOT NULL,
    role public.user_role NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    governorate public.jordan_governorates,
    first_name text,
    last_name text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 3293 (class 2604 OID 16517)
-- Name: service_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_categories ALTER COLUMN id SET DEFAULT nextval('public.service_categories_id_seq'::regclass);


--
-- TOC entry 3549 (class 0 OID 16641)
-- Dependencies: 226
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, user_id, permissions, created_at) FROM stdin;
\.


--
-- TOC entry 3545 (class 0 OID 16547)
-- Dependencies: 222
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, client_id, provider_id, category_id, status, scheduled_at, notes, created_at) FROM stdin;
\.


--
-- TOC entry 3540 (class 0 OID 16477)
-- Dependencies: 217
-- Data for Name: client_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_profiles (id, user_id, address, profile_pic_url) FROM stdin;
\.


--
-- TOC entry 3547 (class 0 OID 16600)
-- Dependencies: 224
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, client_id, provider_id, created_at) FROM stdin;
\.


--
-- TOC entry 3552 (class 0 OID 16745)
-- Dependencies: 229
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, sender_id, receiver_id, booking_id, content, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 3546 (class 0 OID 16585)
-- Dependencies: 223
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, message, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 3550 (class 0 OID 16721)
-- Dependencies: 227
-- Data for Name: provider_areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_areas (id, provider_id, governorate, district, is_primary) FROM stdin;
\.


--
-- TOC entry 3551 (class 0 OID 16733)
-- Dependencies: 228
-- Data for Name: provider_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_availability (id, provider_id, day_of_week, start_time, end_time, is_available) FROM stdin;
\.


--
-- TOC entry 3553 (class 0 OID 16770)
-- Dependencies: 230
-- Data for Name: provider_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_documents (id, provider_id, doc_type, file_url, is_approved, uploaded_at) FROM stdin;
\.


--
-- TOC entry 3541 (class 0 OID 16492)
-- Dependencies: 218
-- Data for Name: provider_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_profiles (id, user_id, specialty, is_verified, bio, avg_rating, profile_pic_url, experience_years) FROM stdin;
\.


--
-- TOC entry 3544 (class 0 OID 16528)
-- Dependencies: 221
-- Data for Name: provider_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_services (id, provider_id, category_id, description) FROM stdin;
\.


--
-- TOC entry 3548 (class 0 OID 16619)
-- Dependencies: 225
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, booking_id, provider_id, rating, comment, created_at, client_id) FROM stdin;
\.


--
-- TOC entry 3543 (class 0 OID 16514)
-- Dependencies: 220
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_categories (id, name_ar, icon, is_active) FROM stdin;
\.


--
-- TOC entry 3539 (class 0 OID 16461)
-- Dependencies: 216
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, phone, role, password_hash, created_at, updated_at, governorate, first_name, last_name) FROM stdin;
\.


--
-- TOC entry 3562 (class 0 OID 0)
-- Dependencies: 219
-- Name: service_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_categories_id_seq', 1, false);


--
-- TOC entry 3358 (class 2606 OID 16650)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- TOC entry 3360 (class 2606 OID 16652)
-- Name: admins admins_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_key UNIQUE (user_id);


--
-- TOC entry 3346 (class 2606 OID 16557)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 3332 (class 2606 OID 16483)
-- Name: client_profiles client_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_profiles
    ADD CONSTRAINT client_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3334 (class 2606 OID 16485)
-- Name: client_profiles client_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_profiles
    ADD CONSTRAINT client_profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 3350 (class 2606 OID 16608)
-- Name: favorites favorites_client_id_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_client_id_provider_id_key UNIQUE (client_id, provider_id);


--
-- TOC entry 3352 (class 2606 OID 16606)
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- TOC entry 3366 (class 2606 OID 16754)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3348 (class 2606 OID 16594)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3362 (class 2606 OID 16727)
-- Name: provider_areas provider_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_areas
    ADD CONSTRAINT provider_areas_pkey PRIMARY KEY (id);


--
-- TOC entry 3364 (class 2606 OID 16739)
-- Name: provider_availability provider_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_availability
    ADD CONSTRAINT provider_availability_pkey PRIMARY KEY (id);


--
-- TOC entry 3368 (class 2606 OID 16779)
-- Name: provider_documents provider_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_documents
    ADD CONSTRAINT provider_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3336 (class 2606 OID 16503)
-- Name: provider_profiles provider_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3338 (class 2606 OID 16505)
-- Name: provider_profiles provider_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 3344 (class 2606 OID 16535)
-- Name: provider_services provider_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_pkey PRIMARY KEY (id);


--
-- TOC entry 3354 (class 2606 OID 16630)
-- Name: reviews reviews_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_key UNIQUE (booking_id);


--
-- TOC entry 3356 (class 2606 OID 16628)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 3340 (class 2606 OID 16526)
-- Name: service_categories service_categories_name_ar_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_name_ar_key UNIQUE (name_ar);


--
-- TOC entry 3342 (class 2606 OID 16524)
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3326 (class 2606 OID 16472)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3328 (class 2606 OID 16474)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 3330 (class 2606 OID 16470)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3396 (class 2620 OID 16573)
-- Name: bookings update_bookings_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_bookings_modtime BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3394 (class 2620 OID 16527)
-- Name: service_categories update_categories_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3392 (class 2620 OID 16511)
-- Name: client_profiles update_client_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_client_modtime BEFORE UPDATE ON public.client_profiles FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3393 (class 2620 OID 16512)
-- Name: provider_profiles update_provider_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_provider_modtime BEFORE UPDATE ON public.provider_profiles FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3395 (class 2620 OID 16546)
-- Name: provider_services update_provider_services_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_provider_services_modtime BEFORE UPDATE ON public.provider_services FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3391 (class 2620 OID 16476)
-- Name: users updated_user_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER updated_user_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: reviews update_reviews_modtime; Type: TRIGGER
--

CREATE TRIGGER update_reviews_modtime BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: messages update_messages_modtime; Type: TRIGGER
--

CREATE TRIGGER update_messages_modtime BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 3373 (class 2606 OID 16568)
-- Name: bookings bookings_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id);


--
-- TOC entry 3374 (class 2606 OID 16558)
-- Name: bookings bookings_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.client_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3375 (class 2606 OID 16563)
-- Name: bookings bookings_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3369 (class 2606 OID 16486)
-- Name: client_profiles client_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_profiles
    ADD CONSTRAINT client_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3378 (class 2606 OID 16609)
-- Name: favorites favorites_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.client_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3379 (class 2606 OID 16614)
-- Name: favorites favorites_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3384 (class 2606 OID 16653)
-- Name: admins fk_admin_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3385 (class 2606 OID 16728)
-- Name: provider_areas fk_area_provider; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_areas
    ADD CONSTRAINT fk_area_provider FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3386 (class 2606 OID 16740)
-- Name: provider_availability fk_availability_provider; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_availability
    ADD CONSTRAINT fk_availability_provider FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE CASCADE;





--
-- TOC entry 3390 (class 2606 OID 16780)
-- Name: provider_documents fk_doc_provider; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_documents
    ADD CONSTRAINT fk_doc_provider FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3387 (class 2606 OID 16765)
-- Name: messages fk_msg_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_msg_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- TOC entry 3388 (class 2606 OID 16760)
-- Name: messages fk_msg_receiver; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3389 (class 2606 OID 16755)
-- Name: messages fk_msg_sender; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3370 (class 2606 OID 16796)
-- Name: provider_profiles fk_provider_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT fk_provider_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3380 (class 2606 OID 16808)
-- Name: reviews fk_rev_client; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_rev_client FOREIGN KEY (client_id) REFERENCES public.client_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3381 (class 2606 OID 16813)
-- Name: reviews fk_rev_provider; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT fk_rev_provider FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3377 (class 2606 OID 16595)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3371 (class 2606 OID 16541)
-- Name: provider_services provider_services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE;


--
-- TOC entry 3372 (class 2606 OID 16536)
-- Name: provider_services provider_services_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE CASCADE;


--
-- TOC entry 3382 (class 2606 OID 16631)
-- Name: reviews reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 3383 (class 2606 OID 16636)
-- Name: reviews reviews_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE CASCADE;


-- Completed on 2026-05-08 23:12:49

--
-- PostgreSQL database dump complete
--