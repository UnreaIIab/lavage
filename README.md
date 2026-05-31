# LavagePro – Setup & Deployment Guide

## Overview
LavagePro is a car-wash management system built with **React + Vite + Supabase**.  
All data is stored in Supabase PostgreSQL with Row Level Security so each user only sees their own data.

---

## 1 — Supabase Setup

1. Create a free project at https://supabase.com
2. In **SQL Editor**, paste and run `supabase_schema.sql`
3. Go to **Authentication → Providers** → enable **Email**
4. Go to **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcxyz.supabase.co`)
   - **anon public** key

---

## 2 — Local Development

```bash
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm run dev
```

---

## 3 — Build for Production

```bash
npm run build
# Output goes to dist/
```

---

## 4 — Deploy to Hostinger

1. Run `npm run build` (env vars are baked in at build time)
2. Log in to Hostinger hPanel → **File Manager**
3. Navigate to `public_html/` and upload **all files inside** `dist/`
4. The `.htaccess` handles SPA routing and HTTPS redirects automatically

> **Security note:** `VITE_SUPABASE_ANON_KEY` is safe to expose in the browser.
> Supabase RLS ensures users can only access their own data.
> Never expose the Supabase **service role** key.

---

## 5 — First Login

1. Open your URL → click **"S'inscrire"** to create your admin account
2. Confirm your email (if Supabase confirmation is on)
3. Log in — demo data is seeded automatically on first login

---

## 6 — Security Model

| Layer | Mechanism |
|---|---|
| Auth | Supabase email/password JWT |
| Frontend | `ProtectedRoute` redirects unauthenticated users to `/login` |
| Database | Row Level Security: `user_id = auth.uid()` on every table |
| Transport | HTTPS enforced in `.htaccess` |
| Headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
