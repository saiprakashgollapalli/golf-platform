# 🌿 GreenHeart — Golf Charity Subscription Platform

> Golf. Give. Win. — A subscription platform combining Stableford score tracking, monthly prize draws, and charitable giving.

---

## 📋 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| Deployment | Vercel (frontend) + Supabase (backend) |
| Auth | Supabase Auth (JWT-based) |
| Payments | Mock Stripe (simulated) |

---

## 🚀 STEP-BY-STEP DEPLOYMENT GUIDE

### STEP 1 — Create a New Supabase Project

1. Go to **https://supabase.com** and sign in (or create a free account)
2. Click **"New Project"**
3. Fill in:
   - **Project name:** `greenheart-golf` (or any name)
   - **Database Password:** Generate a strong password and **save it somewhere safe**
   - **Region:** Choose one closest to your users
4. Click **"Create new project"** and wait ~2 minutes for it to provision

### STEP 2 — Run the Database Schema

1. In your new Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. **Copy the entire contents** and paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see: `Success. No rows returned`

> ⚠️ If you see any errors about policies already existing, that's fine — the schema includes storage bucket setup which may warn if the bucket already exists.

### STEP 3 — Create Demo Users

**In Supabase → Authentication → Users → Add User:**

**Demo User:**
- Email: `user@demo.com`
- Password: `Demo1234!`
- Click "Create User"

**Demo Admin:**
- Email: `admin@demo.com`  
- Password: `Admin1234!`
- Click "Create User"

**Then promote the admin — in SQL Editor run:**
```sql
SELECT make_admin('admin@demo.com');
```

### STEP 4 — Get Your Supabase API Keys

1. In Supabase → **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (the long key under "Project API keys")

### STEP 5 — Set Up the Frontend Locally (for testing)

```bash
# 1. Navigate to the project folder
cd golf-platform

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Edit .env.local and fill in your Supabase values:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 5. Run the development server
npm run dev

# Open http://localhost:3000
```

### STEP 6 — Deploy to a NEW Vercel Account

1. Go to **https://vercel.com** and create a brand new account (use a different email)
2. Click **"Add New → Project"**
3. Choose **"Import Git Repository"**
   - Push your code to GitHub first:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/YOUR_USERNAME/greenheart-golf.git
     git push -u origin main
     ```
   - Then import that repository in Vercel
4. Vercel will auto-detect Next.js — leave Framework as "Next.js"
5. **Before deploying, click "Environment Variables"** and add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

6. Click **"Deploy"**
7. Wait ~2 minutes — your site will be live at `https://your-project.vercel.app`

### STEP 7 — Post-Deployment: Update Supabase Auth Settings

1. In Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://your-project.vercel.app`
3. Add to **Redirect URLs**: `https://your-project.vercel.app/auth/callback`
4. Click **Save**

---

## 🔑 Test Credentials

| Role | Email | Password |
|---|---|---|
| Demo User | `user@demo.com` | `Demo1234!` |
| Demo Admin | `admin@demo.com` | `Admin1234!` |

---

## 📁 Project Structure

```
golf-platform/
├── app/
│   ├── page.tsx                    # Public homepage
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── auth/
│   │   ├── login/page.tsx          # Login page
│   │   └── signup/page.tsx         # Multi-step signup
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard shell (sidebar + header)
│   │   ├── page.tsx                # Dashboard overview
│   │   ├── scores/page.tsx         # Score management
│   │   ├── charity/page.tsx        # Charity selection
│   │   └── wins/page.tsx           # Winnings & proof upload
│   └── admin/
│       ├── layout.tsx              # Admin shell
│       ├── page.tsx                # Admin overview
│       ├── users/page.tsx          # User management
│       ├── charities/page.tsx      # Charity CRUD
│       ├── draws/page.tsx          # Draw engine
│       └── winners/page.tsx        # Winner verification
├── components/
│   ├── CharityCard.tsx             # Reusable charity card
│   ├── dashboard/
│   │   ├── DashboardSidebar.tsx    # Nav sidebar
│   │   ├── DashboardHeader.tsx     # Top bar
│   │   ├── ScoreManager.tsx        # Score entry/edit/delete
│   │   ├── CharitySelector.tsx     # Charity picker with slider
│   │   └── WinningsView.tsx        # Wins + proof upload
│   └── admin/
│       ├── AdminSidebar.tsx        # Admin nav
│       ├── AdminUsersClient.tsx    # User list + actions
│       ├── AdminDrawsClient.tsx    # Draw engine UI
│       ├── AdminWinnersClient.tsx  # Verification UI
│       └── AdminCharitiesClient.tsx # Charity CRUD UI
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client
│   ├── types.ts                    # All TypeScript types
│   ├── draw-engine.ts              # Draw logic (random + algorithmic)
│   └── utils.ts                    # Helpers (format, cn, dates)
├── supabase/
│   └── schema.sql                  # Complete DB schema + seed data
├── middleware.ts                   # Route protection
├── .env.example                    # Environment variable template
└── package.json
```

---

## 🎯 Features Implemented

### User Features
- ✅ Multi-step signup (account → plan → charity)
- ✅ Monthly & yearly subscription (mock Stripe)
- ✅ Dashboard with all PRD modules
- ✅ Score entry with rolling 5-score limit (DB trigger)
- ✅ Score edit and delete
- ✅ Charity selection with contribution % slider
- ✅ Charity search and category filter
- ✅ Winnings history with payment status
- ✅ Proof upload for winner verification

### Draw System
- ✅ Random number generation
- ✅ Algorithmic generation (weighted by score frequency)
- ✅ 5-match, 4-match, 3-match tiers
- ✅ Prize pool calculation (60% of subscriptions)
- ✅ Prize distribution (40/35/25%)
- ✅ Jackpot rollover when no 5-match winner
- ✅ Simulation mode before publishing
- ✅ Full draw history

### Admin Panel
- ✅ User management (edit, toggle role, cancel subscription)
- ✅ Charity CRUD (add, edit, delete, feature/hide)
- ✅ Draw configuration (type, month, year)
- ✅ Draw simulation + publish
- ✅ Winner verification (approve/reject/mark paid)
- ✅ Admin overview with stats
- ✅ Revenue breakdown

### UI/UX
- ✅ Dark, modern, non-golf-themed design
- ✅ Glassmorphism cards
- ✅ Gradient animations
- ✅ Mobile responsive (drawer nav)
- ✅ Loading states on all async actions
- ✅ Toast notifications
- ✅ Error handling on all forms

---

## 🔒 Security

- Row Level Security (RLS) on all tables
- JWT-based authentication via Supabase
- Admin role check in both middleware and RLS policies
- Protected routes via Next.js middleware
- Supabase anon key only exposes what RLS allows

---

## 📈 Scaling Notes

- DB schema supports multi-country via currency field
- Charity events module ready for expansion
- Corporate/team accounts: add `team_id` to profiles
- Mobile app: use same Supabase backend with React Native
- Real Stripe: replace mock subscription insert with `stripe.subscriptions.create()`

---

## 🐛 Troubleshooting

**"relation does not exist" error:**
→ Run the full `schema.sql` in Supabase SQL Editor

**Login redirects to login again:**
→ Check your `.env.local` has the correct Supabase URL and anon key

**Images not loading:**
→ The app uses Unsplash URLs for charity images — internet connection required

**Admin panel shows "Access denied":**
→ Run `SELECT make_admin('your-email@example.com');` in Supabase SQL Editor

**Storage upload fails:**
→ The storage bucket `winner-proofs` must exist — it's created by `schema.sql`

---

## 📞 Support

Built to PRD spec by GreenHeart platform scaffold.
All features from PRD sections 01–16 are implemented.
