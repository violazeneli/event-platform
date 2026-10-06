# Eventify — Setup Guide

This is everything you need to do once in **Supabase** and **locally** to get the app working end-to-end. If sign-up / sign-in don't work, the cause is almost always one of the items in **Step 2** or **Step 3** below — go through them carefully.

---

## STEP 1 — Make sure your `.env` is correct

Your `.env` (already in this folder) needs these two lines:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi…   ← OR a sb_publishable_… key
```

Both new (`sb_publishable_…`) and legacy (`eyJ…`) anon keys work.
Find them in **Supabase → Project Settings → API**.

After editing `.env`, **restart the dev server** (`Ctrl+C` then `npm run dev`).

---

## STEP 2 — Run the database SQL (one-time)

In your Supabase project go to **SQL Editor → New query** and paste this whole block, then click **Run**:

```sql
-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  bio         TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  location         TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT 'other',
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  images           TEXT[] DEFAULT '{}',
  attendees_count  INTEGER DEFAULT 0,
  created_by       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events   ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (safe re-run)
DROP POLICY IF EXISTS "Profiles are publicly readable"     ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Admins full access to profiles"     ON public.profiles;
DROP POLICY IF EXISTS "Events are publicly readable"       ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events"        ON public.events;
DROP POLICY IF EXISTS "Users can delete own events"        ON public.events;
DROP POLICY IF EXISTS "Admins full access to events"       ON public.events;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Admins full access to profiles"
  ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Events are publicly readable"
  ON public.events FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own events"
  ON public.events FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own events"
  ON public.events FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins full access to events"
  ON public.events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Optional helper RPC
CREATE OR REPLACE FUNCTION public.increment_attendees(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.events SET attendees_count = attendees_count + 1 WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## STEP 3 — Turn off email confirmation (optional but recommended for dev)

By default, when a user signs up, **Supabase requires them to click a confirmation link** before they can sign in. While you're developing this is annoying. To turn it off:

**Supabase → Authentication → Providers → Email →** un-toggle **"Confirm email" → Save**.

(If you keep it on, the app now correctly detects this and shows a "check your inbox" message. You'll just need to click the link in your email before signing in.)

---

## STEP 4 — Storage bucket for event images

In **Supabase → Storage → New bucket**:
- name: `event-images`
- toggle **Public bucket: ON**
- Save

Then in the **SQL Editor** run this once (so people can upload):

```sql
DROP POLICY IF EXISTS "Public read"   ON storage.objects;
DROP POLICY IF EXISTS "Auth upload"   ON storage.objects;
DROP POLICY IF EXISTS "Auth update"   ON storage.objects;
DROP POLICY IF EXISTS "Auth delete"   ON storage.objects;

CREATE POLICY "Public read"   ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Auth upload"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');
CREATE POLICY "Auth update"   ON storage.objects FOR UPDATE USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth delete"   ON storage.objects FOR DELETE USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## STEP 5 — Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

---

## STEP 6 — Make yourself an admin

After you sign up:

1. Supabase → **Table Editor → profiles**
2. Find your row, change `role` from `user` → `admin`
3. Sign out, sign back in. The navbar will now show an **Admin** option in your account menu, and signing in will take you straight to **/admin**.

---

## What's where in the app

| URL                       | Who sees it |
| ------------------------- | ----------- |
| `/`                       | Everyone — short welcome page |
| `/events/upcoming`        | Everyone — sidebar filters + grid |
| `/events/past`            | Everyone — sidebar filters + grid |
| `/events/:id`             | Everyone — event details |
| `/events/create`          | Everyone — guests get a sign-in prompt |
| `/dashboard`              | Signed-in users — sidebar with Overview / Profile / My Events / Browse |
| `/dashboard?tab=profile`  | direct deep-link |
| `/dashboard?tab=events`   | direct deep-link |
| `/admin`                  | Admins only — sidebar with Overview / Events / Users / Statistics |

---

## Troubleshooting

**"Invalid email or password"** when you know it's correct → email confirmation is on. See Step 3.

**"the 'profiles' table is missing"** → you didn't run the SQL in Step 2.

**Sign up fails silently / no confirmation email** → check Supabase → Authentication → Templates → Confirm signup. The "Site URL" in Authentication → URL Configuration should be `http://localhost:5173`.

**Admin Panel doesn't appear after promoting yourself** → you need to sign out and back in (the profile role is loaded at sign-in).

**"Failed to fetch" anywhere** → wrong VITE_SUPABASE_URL or no internet.
