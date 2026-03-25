-- ============================================================
-- UNFILTERED ADMIN PANEL — DATABASE MIGRATIONS
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Blocked Words Table
CREATE TABLE IF NOT EXISTS blocked_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  language TEXT DEFAULT 'hindi' CHECK (language IN ('hindi', 'english', 'hinglish')),
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with existing hardcoded words
INSERT INTO blocked_words (word, language) VALUES
  ('benchod', 'hindi'),
  ('madarchod', 'hindi'),
  ('bsdk', 'hindi'),
  ('lawde', 'hindi'),
  ('lodo', 'hindi'),
  ('boshdino', 'hindi'),
  ('chutmarino', 'hindi'),
  ('rand', 'hindi'),
  ('maachodi', 'hindi'),
  ('machodi', 'hindi'),
  ('bhadwa', 'hindi'),
  ('bhadwo', 'hindi'),
  ('lasan', 'hindi'),
  ('randi', 'hindi'),
  ('randika bacha', 'hindi'),
  ('chutiyo', 'hindi')
ON CONFLICT (word) DO NOTHING;

-- 2. Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Seed defaults
INSERT INTO platform_settings (key, value) VALUES
  ('auto_hide_threshold', '3'),
  ('openai_moderation_enabled', 'true'),
  ('hindi_filter_enabled', 'true'),
  ('max_post_length', '500'),
  ('allow_revealed_posts', 'true')
ON CONFLICT (key) DO NOTHING;

-- 3. Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add columns to existing tables

-- Reports: add resolution tracking
DO $$ BEGIN
  ALTER TABLE reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
  ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);
  ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Profiles: add ban tracking
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES profiles(id);
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram TEXT DEFAULT '';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter TEXT DEFAULT '';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_anonymous BOOLEAN DEFAULT true;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Posts: add moderation tracking
DO $$ BEGIN
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_flagged BOOLEAN DEFAULT false;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_categories TEXT;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_blocked_word TEXT;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS Policies — COMPREHENSIVE

-- Enable RLS on ALL tables
ALTER TABLE blocked_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Profiles ──
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE USING (is_admin());

-- ── Posts ──
DROP POLICY IF EXISTS "Anyone can read active posts" ON posts;
CREATE POLICY "Anyone can read active posts"
  ON posts FOR SELECT USING (status = 'active' OR user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Authenticated users can insert posts" ON posts;
CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- ── Likes ──
DROP POLICY IF EXISTS "Anyone can read likes" ON likes;
CREATE POLICY "Anyone can read likes"
  ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert likes" ON likes;
CREATE POLICY "Authenticated users can insert likes"
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE USING (auth.uid() = user_id);

-- ── Saves ──
DROP POLICY IF EXISTS "Users can read own saves" ON saves;
CREATE POLICY "Users can read own saves"
  ON saves FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saves" ON saves;
CREATE POLICY "Users can insert own saves"
  ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saves" ON saves;
CREATE POLICY "Users can delete own saves"
  ON saves FOR DELETE USING (auth.uid() = user_id);

-- ── Reposts ──
DROP POLICY IF EXISTS "Anyone can read reposts" ON reposts;
CREATE POLICY "Anyone can read reposts"
  ON reposts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own reposts" ON reposts;
CREATE POLICY "Users can insert own reposts"
  ON reposts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reposts" ON reposts;
CREATE POLICY "Users can delete own reposts"
  ON reposts FOR DELETE USING (auth.uid() = user_id);

-- ── Reports ──
DROP POLICY IF EXISTS "Users can insert reports" ON reports;
CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can read reports" ON reports;
CREATE POLICY "Admins can read reports"
  ON reports FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE USING (is_admin());

-- ── Comments ──
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- ── Blocked Words: everyone can read, only admins can write ──
DROP POLICY IF EXISTS "Anyone can read blocked words" ON blocked_words;
CREATE POLICY "Anyone can read blocked words"
  ON blocked_words FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert blocked words" ON blocked_words;
CREATE POLICY "Admins can insert blocked words"
  ON blocked_words FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete blocked words" ON blocked_words;
CREATE POLICY "Admins can delete blocked words"
  ON blocked_words FOR DELETE USING (is_admin());

-- ── Platform Settings: only admins ──
DROP POLICY IF EXISTS "Admins can read settings" ON platform_settings;
CREATE POLICY "Admins can read settings"
  ON platform_settings FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update settings" ON platform_settings;
CREATE POLICY "Admins can update settings"
  ON platform_settings FOR UPDATE USING (is_admin());

-- ── Activity Log: only admins ──
DROP POLICY IF EXISTS "Admins can read activity log" ON admin_activity_log;
CREATE POLICY "Admins can read activity log"
  ON admin_activity_log FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert activity log" ON admin_activity_log;
CREATE POLICY "Admins can insert activity log"
  ON admin_activity_log FOR INSERT WITH CHECK (is_admin());

-- 7. Make pratham admin
UPDATE profiles SET role = 'admin' WHERE email = 'pratham.solanki30@gmail.com';

