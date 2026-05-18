# V2 "Aurora" UI Overhaul & Platform Run-through

I have successfully overhauled the UI for the second time! The application now features the **Aurora** theme: a stunning, deep-space background with CSS-animated gradients mimicking the Northern Lights. I've completely redesigned the "Add Goal" form to fix contrast and improve UX, removed all AI-generated-looking emojis in favor of sleek `lucide-react` icons, and injected `framer-motion` spring animations everywhere.

## Platform Features Run-through

GoalPulse is a next-generation performance management platform with three primary user personas: Employee, Manager, and Admin. Here is what each role can accomplish.

---

### 👤 Employee Portal (The "Doer")
**Purpose:** Define goals, track progress, and get AI-powered feedback.

1. **Dashboard:** 
   - View high-level metrics: total goals, overall weightage, and the active performance cycle.
   - Boot sequence features smooth stagger animations.
2. **My Goals (`/employee/goals`):**
   - **Create Goals:** Click "Add Goal" to launch the redesigned glassmorphism form. Select Thrust Areas (e.g., Financial, Operational) and Unit of Measurement (Numeric, Timeline, Zero Target).
   - **Weightage Distribution:** Use the horizontal slider to allocate importance (10% to 80%). The `WeightageDistributor` bar dynamically animates and warns you if the total is not exactly 100%.
   - **Submit:** Send the locked 100% sheet to your manager for approval.
3. **Quarterly Check-ins (`/employee/check-in`):**
   - **Live Progress:** Update your actual targets (e.g., entered ₹40L against a ₹50L target). The system calculates a weighted score in real time.
   - **AI Year-End Prediction:** Click the "Predict My Score" button. GoalPulse queries the local Python XGBoost model (running on port 5001) with your historical momentum to predict what your final score will be at the end of Q4!

---

### 👥 Manager Portal (The "Reviewer")
**Purpose:** Approve team goals and review continuous performance.

1. **Dashboard:**
   - See an animated overview of the team's status (how many sheets are approved, pending, or returned).
2. **Approvals (`/manager/approvals`):**
   - Review goal sheets submitted by your direct reports.
   - **Interact:** Click a pending sheet, and it smoothly expands to reveal the goals and their weightages.
   - **Action:** Either "Approve" (locks the sheet for the year) or "Return" (sends it back to the employee with mandatory feedback so they can fix it).
3. **Check-ins:**
   - Monitor the live score matrix of the team across Q1-Q4 to identify employees who are falling behind.

---

### 🛡️ Admin Portal (The "Governor")
**Purpose:** System configuration, HR oversight, and analytics.

1. **Dashboard:**
   - High-level platform health (Total Users, Approved Sheets).
   - **Audit Log Preview:** See every major action taken on the platform (e.g., when a manager approved a sheet) for compliance tracking.
2. **Analytics (`/admin/analytics`):**
   - **Charts:** View Recharts-powered graphs showing Quarter-on-Quarter score trends across the company, goal distribution by department, and manager completion rates.
   - **Export:** Download raw `.xlsx` reports (the backend API handles this).
3. **Cycles & Configuration:**
   - Configure the active performance year (e.g., FY 2024-25) and manually open/close Check-in windows (Q1, Q2, etc.) to enforce strict timelines.

> [!TIP]
> The UI updates are live. Your `pnpm dev` server is still running. Head over to your browser and check out the new Aurora background and the redesigned Add Goal screen!
