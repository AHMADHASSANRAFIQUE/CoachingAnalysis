# 🚀 LEGEND Football Coaching - Supabase Setup Guide

This guide contains everything needed to set up the backend (Supabase) for the LEGEND Football Coaching application.

---

## 1. 🏗️ Database Setup (SQL Editor)
Go to your **Supabase Dashboard -> SQL Editor** and run the following command to create all necessary tables:

```sql
-- User Profiles table
create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  email text,
  role text,
  display_name text,
  created_at timestamp with time zone default now()
);

-- Player Profiles table
create table player_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text,
  position text,
  jersey_number text,
  team_name text,
  age text,
  season_year text,
  created_at timestamp with time zone default now()
);

-- Game Sessions table
create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  player_id uuid,
  date text,
  opponent text,
  position text,
  overall_grade text,
  letter_grade text,
  youtube_url text,
  stats jsonb,
  feedback jsonb,
  team_name text,
  player_name text,
  age text,
  created_at timestamp with time zone default now()
);
```

---

## 2. 🧠 AI Analysis Setup (Edge Functions)
The "Film Analysis" feature uses Google Gemini AI. To set it up:

### **A. Add Gemini API Key**
1. Get an API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. In Supabase Dashboard, go to **Edge Functions -> Manage Secrets**.
3. Add a new secret:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `your_actual_gemini_api_key_here`

### **B. Deploy the Function**
Run these commands in your project terminal:
```bash
# 1. Login to Supabase
npx supabase login

# 2. Link to your project (Replace <project-id> with your actual project ID)
npx supabase link --project-ref <your-project-id>

# 3. Deploy the analysis function
npx supabase functions deploy analyze-film --no-verify-jwt
```

---

## 3. 🌐 Frontend Configuration (Vercel)
Ensure the following **Environment Variables** are set in your Vercel Dashboard (**Settings -> Environment Variables**):

| Variable Name | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon (Public) Key |
| `VITE_GEMINI_API_KEY` | Your Google Gemini API Key |

---

## 🛠️ Troubleshooting
- **Non-2xx Error:** Usually means the `GEMINI_API_KEY` is missing from Supabase Secrets or the function hasn't been deployed.
- **Database Error:** Ensure you have run the SQL commands in Step 1.
- **Auth Error:** Ensure **Email Auth** is enabled in **Supabase Dashboard -> Authentication -> Providers**.

---
*Created for LEGEND Football Coaching App.*
