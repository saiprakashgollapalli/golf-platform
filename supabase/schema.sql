-- ============================================================
-- GOLF CHARITY SUBSCRIPTION PLATFORM — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  charity_id UUID,
  charity_contribution_pct INTEGER NOT NULL DEFAULT 10 CHECK (charity_contribution_pct >= 10 AND charity_contribution_pct <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 2. CHARITIES
-- ============================================================
CREATE TABLE public.charities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  image_url TEXT,
  website_url TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  total_raised NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active charities" ON public.charities
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage charities" ON public.charities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 3. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'lapsed', 'pending')),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 4. SCORES (rolling 5-score logic enforced by trigger)
-- ============================================================
CREATE TABLE public.scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_at DATE NOT NULL,
  course_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores" ON public.scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores" ON public.scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores" ON public.scores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scores" ON public.scores
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all scores" ON public.scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger: enforce rolling 5-score limit per user
CREATE OR REPLACE FUNCTION enforce_rolling_scores()
RETURNS TRIGGER AS $$
DECLARE
  score_count INTEGER;
  oldest_score_id UUID;
BEGIN
  SELECT COUNT(*) INTO score_count FROM public.scores WHERE user_id = NEW.user_id;
  IF score_count >= 5 THEN
    SELECT id INTO oldest_score_id
    FROM public.scores
    WHERE user_id = NEW.user_id
    ORDER BY played_at ASC, created_at ASC
    LIMIT 1;
    DELETE FROM public.scores WHERE id = oldest_score_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER rolling_scores_trigger
  BEFORE INSERT ON public.scores
  FOR EACH ROW EXECUTE FUNCTION enforce_rolling_scores();

-- ============================================================
-- 5. DRAWS
-- ============================================================
CREATE TABLE public.draws (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  draw_type TEXT NOT NULL DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}',
  prize_pool_total NUMERIC(12,2) DEFAULT 0,
  jackpot_amount NUMERIC(12,2) DEFAULT 0,
  pool_4match NUMERIC(12,2) DEFAULT 0,
  pool_3match NUMERIC(12,2) DEFAULT 0,
  jackpot_rolled_over BOOLEAN DEFAULT FALSE,
  rolled_over_from UUID REFERENCES public.draws(id),
  participant_count INTEGER DEFAULT 0,
  notes TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(month, year)
);

ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published draws" ON public.draws
  FOR SELECT USING (status = 'published' OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage draws" ON public.draws
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 6. DRAW ENTRIES (snapshot of user scores at draw time)
-- ============================================================
CREATE TABLE public.draw_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_numbers INTEGER[] NOT NULL,
  match_count INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries" ON public.draw_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all entries" ON public.draw_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 7. WINNERS
-- ============================================================
CREATE TABLE public.winners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES public.draw_entries(id) ON DELETE CASCADE NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('5-match', '4-match', '3-match')),
  prize_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'paid', 'rejected')),
  proof_url TEXT,
  proof_submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own winnings" ON public.winners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own proof" ON public.winners
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all winners" ON public.winners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 8. PAYMENTS (mock)
-- ============================================================
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_type TEXT NOT NULL DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'donation')),
  stripe_payment_intent_id TEXT,
  charity_amount NUMERIC(10,2) DEFAULT 0,
  prize_pool_amount NUMERIC(10,2) DEFAULT 0,
  platform_amount NUMERIC(10,2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 9. CHARITY EVENTS
-- ============================================================
CREATE TABLE public.charity_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  registration_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.charity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view charity events" ON public.charity_events
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage charity events" ON public.charity_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 10. TRIGGERS: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER charities_updated_at BEFORE UPDATE ON public.charities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER draws_updated_at BEFORE UPDATE ON public.draws FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER winners_updated_at BEFORE UPDATE ON public.winners FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 11. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 12. SEED DATA — CHARITIES
-- ============================================================
INSERT INTO public.charities (name, description, long_description, category, is_featured, image_url) VALUES
(
  'Prostate Cancer UK',
  'Fighting the most common cancer in men. Every man diagnosed, every family affected.',
  'Prostate Cancer UK is the leading men''s health charity fighting the most common cancer in men. We fund research, support men and their families, and campaign to improve care.',
  'Health',
  TRUE,
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800'
),
(
  'Macmillan Cancer Support',
  'No one should face cancer alone. We provide care, support and information.',
  'Macmillan Cancer Support improves the lives of people affected by cancer. We provide medical, emotional, practical and financial support and push for better cancer care.',
  'Health',
  TRUE,
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800'
),
(
  'Age UK',
  'Making later life better for everyone. Fighting loneliness and poverty in older age.',
  'Age UK is the country''s leading charity helping every older person who needs us. We provide a wide range of services, advice and support for people over 65.',
  'Elderly Care',
  FALSE,
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800'
),
(
  'Children''s Society',
  'Changing lives for vulnerable children and young people across England.',
  'The Children''s Society is a national charity that runs local services, changing children''s lives and campaigning for improvements to laws affecting children.',
  'Children',
  FALSE,
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800'
),
(
  'WWF UK',
  'We''re fighting to protect and restore the natural world, before it''s too late.',
  'WWF is the world''s leading conservation organisation, working in 100 countries to stop the degradation of the natural world and to build a future in which humans live in harmony with nature.',
  'Environment',
  TRUE,
  'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800'
),
(
  'Mind',
  'Better mental health for all. We provide advice and support to anyone experiencing a mental health problem.',
  'Mind provides advice and support to empower anyone experiencing a mental health problem. We campaign to improve services, raise awareness and promote understanding.',
  'Mental Health',
  FALSE,
  'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800'
);

-- ============================================================
-- 13. STORAGE BUCKET FOR PROOF UPLOADS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('winner-proofs', 'winner-proofs', FALSE);

CREATE POLICY "Winners can upload their own proof" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'winner-proofs' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own proof" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'winner-proofs' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'winner-proofs' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 14. DEMO ADMIN USER (update email/password in Supabase Auth UI)
-- This function promotes a user to admin by email
-- ============================================================
CREATE OR REPLACE FUNCTION make_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- After creating admin user via Supabase Auth, run:
-- SELECT make_admin('admin@golfcharity.com');
