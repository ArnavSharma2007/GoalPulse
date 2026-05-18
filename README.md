# GoalPulse

A goal management portal built for the AtomQuest Hackathon 1.0. Three roles, four quarters, one workflow.

---

## What it does

Most goal-tracking at organisations lives in spreadsheets that nobody updates, or in HR tools that nobody opens. GoalPulse is a structured alternative — employees set goals at the start of the year, managers approve them, and everyone checks in quarterly. At the end you have actual data, not a spreadsheet someone filled in retrospectively.

There's also a score predictor. After Q1 and Q2 actuals are in, it forecasts where an employee will finish the year. Trained on 50,000 synthetic goal sheets generated from the scoring formula itself, so MAPE sits under 1%.

---

## Live links

| | |
|---|---|
| **App** | https://goalpulse-2fqrhs7r7-arnavsharma2k7-6560s-projects.vercel.app/login |
| **AI API** | https://goalpulse-ai-w332.onrender.com/health |

**Test credentials**

| Role | Email | Password |
|---|---|---|
| Employee | employee@test.com | Test@1234 |
| Manager | manager@test.com | Test@1234 |
| Admin | admin@test.com | Test@1234 |

> The AI server is on Render's free tier and spins down after inactivity. First prediction request may take ~30 seconds.

---

## Stack

- **Frontend** — Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui
- **Database** — Supabase (PostgreSQL + Row Level Security)
- **Auth** — Supabase Auth with SSR cookie sessions
- **Email** — Resend
- **AI** — scikit-learn (Gradient Boosting Regressor), Flask, Gunicorn, deployed on Render
- **Charts** — Recharts
- **Export** — xlsx (npm)
- **Hosting** — Vercel

Total infra cost: **$0/month**

---

## How the scoring works

Four goal types, each with its own formula:

| Type | When to use | Formula |
|---|---|---|
| `numeric_min` | Higher is better (revenue, units sold) | `min(actual / target × 100, 150)` |
| `numeric_max` | Lower is better (TAT, cost, errors) | `min(target / actual × 100, 150)` |
| `timeline` | Date-based milestones | `100` if on time, `-2 per day late`, floor at `0` |
| `zero` | Incident targets | `100` if actual = 0, else `0` |

Each goal has a weightage (minimum 10%, total must equal exactly 100%). The final score is the weighted average across all goals.

---

## Running locally

**Prerequisites:** Node 18+, Python 3.11, a Supabase project, a Resend account

```bash
git clone https://github.com/ArnavSharma2007/GoalPulse
cd GoalPulse
pnpm install
```

Create `.env.local` in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_AI_API_URL=http://localhost:5001
```

Run the database migrations from `supabase/migrations/` in your Supabase SQL editor, then:

```bash
pnpm dev
```

**For the AI server:**

```bash
cd ai_model
pip install -r requirements.txt
python server.py
```

The Flask server starts on port 5001. The Next.js app calls it at `/api/ai/predict`.

---

## AI model

The predictor is a Gradient Boosting Regressor trained on synthetic data. Because the scoring formula is deterministic, training data can be generated programmatically — which means the model essentially learns the formula.

```bash
cd ai_model
python generate_data.py   # generates 50k training samples
python train_model.py     # trains and saves model.joblib + scaler.joblib
```

Typical output:
```
MAPE : 0.0318%
R²   : 0.999997
✅ TARGET MET: MAPE < 1%
```

The trained artifacts (`model.joblib`, `scaler.joblib`, `feature_names.json`) are committed to the repo so the server doesn't need to retrain on deploy.

---

## Project structure

```
GoalPulse/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── employee/          # dashboard, goals, check-in
│   │   ├── manager/           # dashboard, approvals, check-in
│   │   ├── admin/             # dashboard, cycles, escalations, audit-log, analytics
│   │   └── api/               # goals, achievements, approvals, reports, escalations, ai
│   ├── components/
│   │   ├── GoalForm/
│   │   ├── WeightageDistributor/
│   │   ├── CheckinCard/
│   │   ├── Navigation/
│   │   └── analytics/
│   ├── lib/
│   │   ├── scoreCalculator.ts
│   │   ├── goalValidation.ts
│   │   ├── auditLogger.ts
│   │   ├── cycleUtils.ts
│   │   └── supabase/
│   └── types/
├── ai_model/
│   ├── generate_data.py
│   ├── train_model.py
│   ├── server.py
│   ├── model.joblib
│   └── requirements.txt
└── supabase/
    └── migrations/
```

---

## Database

10 tables, RLS enabled on all of them.

`users` → `goal_sheets` → `goals` → `achievements` is the core chain. `audit_log` captures every post-approval change. `escalation_rules` drives the notification engine. `ai_predictions` stores model outputs so managers can see forecast history.

---

## Roles

**Employee** — sets goals during Phase 1, updates actuals each quarter, can request an AI score forecast after Q2.

**Manager** — approves or returns goal sheets with a written reason, adds check-in comments per quarter, sees team completion rates.

**Admin** — configures fiscal cycles, manages escalation rules, views the full audit log, exports achievement reports as Excel, accesses the analytics dashboard.

---

## Escalations

Three triggers: goal not submitted, approval pending too long, check-in missed. Each has a configurable day threshold. Admins can run escalations manually from the panel or let the Vercel cron handle it daily at 8 AM UTC.

---

Built by Arnav Sharma — Chitkara University, 4th Semester
