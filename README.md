# 🚀 My Personal Dashboard

A modern, high-performance **Personal Operating System** built with **Next.js (App Router)**, **Prisma ORM**, and a remote **Neon PostgreSQL** serverless database. Deployed globally on **Vercel**.

```
Client (Browser)  ⇄  Next.js 16 App Router (Vercel Edge/Serverless)  ⇄  Prisma ORM  ⇄  Neon Serverless PostgreSQL
```

---

## 🌟 Key Pillars & Features

- **⚡ Cloud PostgreSQL Database**: Multi-tenant database schema managed via Prisma ORM on [Neon.tech](https://neon.tech), with connection pooling for ultra-fast serverless queries.
- **🔐 JWT Authentication & Tenant Isolation**: Secure user accounts with bcrypt password hashing and row-level tenant data isolation.
- **📋 Daily & Weekly Task Hub**: Dynamic Saturday-to-Friday planner with categories, priority tags, and time-block scheduling.
- **🦷 Dental Clinical Portfolio**: Case documentation studio with before/after photo sliders, procedure step trackers, material lists, and showcase patient cards.
- **🏋️ Workout Split & PR Tracker**: Complete push/pull/legs exercise library, set/rep targets, live session logger, and all-time Personal Record (PR) progression charts.
- **📈 Life Master Roadmap**: Strategic phase milestones across Dental Career, US Stocks Trading, Studies, and Wealth Creation pillars.
- **💰 Financial Command Center & Gold Vault**: Live Net Worth calculation, income/expense transaction ledger, monthly savings budget pace, and real-time 24k/21k/18k gold bullion valuations.
- **🔁 Weekly Recurring Templates**: Automated weekly schedule generators for recurring clinic shifts, study blocks, and trading sessions.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vanilla ES6+ JavaScript, CSS3 Glassmorphism design system, Chart.js progression engines.
- **Framework**: Next.js 16.3.4 (App Router & Turbopack)
- **Database**: PostgreSQL 18.6 hosted on [Neon](https://neon.tech)
- **ORM**: Prisma Client v5.22
- **Authentication**: JWT (JSON Web Tokens) with Bearer token header interceptor
- **Hosting & CI/CD**: Vercel Git-Integrated Serverless Deployments

---

## 🗄️ Database Tables (Prisma Schema)

| Table Name | Description |
|---|---|
| `users` | User accounts with hashed passwords and profile metadata |
| `tasks` | Daily tasks, categories, segments, priority, and completion status |
| `routines` | Daily habits (Morning / Evening routines) |
| `routine_logs` | Daily habit completion logs |
| `dental_cases` | Clinical dental case documentation, materials, and photos |
| `workout_splits` | Weekly workout day schedules (Saturday → Friday) |
| `workout_exercises` | Exercise registry with target sets and reps |
| `exercise_weight_logs` | Workout logs with weight (kg/lbs) and PR indicators |
| `roadmap_milestones` | Life goals, strategic phases, and interactive key results |
| `financial_transactions` | Income and expense transaction ledger |
| `financial_goals` | Net worth and savings milestones |
| `financial_settings` | Currency, monthly budget, and savings target percentage |
| `assets` & `gold_lots` | Holdings, investments, and physical gold bullion lots |

---

## ⚙️ Local Development

### 1. Clone & Install
```bash
git clone https://github.com/jryusif/my-dashboard.git
cd my-dashboard
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-still-grass-b1plnpi7-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-still-grass-b1plnpi7.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key"
NODE_ENV="development"
```

### 3. Run Database Migrations
```bash
npx prisma migrate deploy
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Vercel Deployment

1. Import this repository into [Vercel](https://vercel.com).
2. Configure the 4 Environment Variables in your Vercel Project Settings:
   - `DATABASE_URL`: Your pooled Neon connection string.
   - `DIRECT_URL`: Your unpooled direct Neon connection string.
   - `JWT_SECRET`: Your secret encryption key.
   - `NODE_ENV`: `production`
3. Click **Deploy**. Vercel will automatically build the Next.js App Router bundle and Prisma client.
