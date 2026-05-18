-- =============================================
-- GoalPulse — Complete Supabase SQL Setup
-- Run each PART separately in SQL Editor
-- =============================================

-- ============ PART A: TABLES ================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'admin')),
  manager_id UUID REFERENCES public.users(id),
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phase1_open DATE NOT NULL,
  q1_open DATE NOT NULL,
  q2_open DATE NOT NULL,
  q3_open DATE NOT NULL,
  q4_open DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.thrust_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.goal_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.users(id),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','approved','returned')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id),
  return_reason TEXT,
  UNIQUE(employee_id, cycle_id)
);

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_sheet_id UUID NOT NULL REFERENCES public.goal_sheets(id) ON DELETE CASCADE,
  thrust_area_id UUID REFERENCES public.thrust_areas(id),
  title TEXT NOT NULL,
  description TEXT,
  uom_type TEXT NOT NULL CHECK (uom_type IN ('numeric_min','numeric_max','timeline','zero')),
  target_value NUMERIC,
  target_date DATE,
  weightage NUMERIC NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_parent_id UUID REFERENCES public.goals(id),
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT min_weightage CHECK (weightage >= 10)
);

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  actual_value NUMERIC,
  actual_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','on_track','completed')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, quarter)
);

CREATE TABLE public.checkin_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_sheet_id UUID NOT NULL REFERENCES public.goal_sheets(id),
  manager_id UUID NOT NULL REFERENCES public.users(id),
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID,
  changed_by UUID REFERENCES public.users(id),
  change_type TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_event TEXT NOT NULL
    CHECK (trigger_event IN ('goal_not_submitted','approval_pending','checkin_missed')),
  days_threshold INT NOT NULL DEFAULT 7,
  notify_skip_level BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_sheet_id UUID NOT NULL REFERENCES public.goal_sheets(id),
  predicted_score NUMERIC,
  confidence NUMERIC,
  input_features JSONB,
  predicted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PART B: RLS ================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thrust_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- USERS
CREATE POLICY "users_read_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_admin_all" ON public.users FOR ALL USING (current_user_role() = 'admin');

-- CYCLES
CREATE POLICY "cycles_read_all" ON public.cycles FOR SELECT USING (true);
CREATE POLICY "cycles_admin_write" ON public.cycles FOR ALL USING (current_user_role() = 'admin');

-- THRUST AREAS
CREATE POLICY "thrust_read_all" ON public.thrust_areas FOR SELECT USING (true);
CREATE POLICY "thrust_admin_write" ON public.thrust_areas FOR ALL USING (current_user_role() = 'admin');

-- GOAL SHEETS
CREATE POLICY "goalsheets_employee_own" ON public.goal_sheets FOR SELECT
  USING (employee_id = auth.uid());
CREATE POLICY "goalsheets_manager_team" ON public.goal_sheets FOR SELECT
  USING (
    current_user_role() = 'manager' AND
    employee_id IN (SELECT id FROM public.users WHERE manager_id = auth.uid())
  );
CREATE POLICY "goalsheets_admin_all" ON public.goal_sheets FOR ALL
  USING (current_user_role() = 'admin');
CREATE POLICY "goalsheets_employee_write" ON public.goal_sheets FOR INSERT
  WITH CHECK (employee_id = auth.uid());
CREATE POLICY "goalsheets_employee_update" ON public.goal_sheets FOR UPDATE
  USING (employee_id = auth.uid() AND status IN ('draft', 'returned'));
CREATE POLICY "goalsheets_manager_update" ON public.goal_sheets FOR UPDATE
  USING (
    current_user_role() = 'manager' AND
    employee_id IN (SELECT id FROM public.users WHERE manager_id = auth.uid())
  );

-- GOALS
CREATE POLICY "goals_read_own" ON public.goals FOR SELECT
  USING (
    goal_sheet_id IN (
      SELECT id FROM public.goal_sheets
      WHERE employee_id = auth.uid()
         OR (current_user_role() = 'manager' AND
             employee_id IN (SELECT id FROM public.users WHERE manager_id = auth.uid()))
    )
    OR current_user_role() = 'admin'
  );
CREATE POLICY "goals_write_own" ON public.goals FOR INSERT
  WITH CHECK (
    goal_sheet_id IN (
      SELECT id FROM public.goal_sheets
      WHERE employee_id = auth.uid() AND status IN ('draft','returned')
    )
  );
CREATE POLICY "goals_update_own" ON public.goals FOR UPDATE
  USING (
    goal_sheet_id IN (
      SELECT id FROM public.goal_sheets
      WHERE employee_id = auth.uid() AND status IN ('draft','returned')
    ) AND is_locked = FALSE
  );
CREATE POLICY "goals_admin_all" ON public.goals FOR ALL USING (current_user_role() = 'admin');

-- ACHIEVEMENTS
CREATE POLICY "achievements_read" ON public.achievements FOR SELECT
  USING (
    goal_id IN (
      SELECT g.id FROM public.goals g
      JOIN public.goal_sheets gs ON g.goal_sheet_id = gs.id
      WHERE gs.employee_id = auth.uid()
         OR current_user_role() IN ('manager','admin')
    )
  );
CREATE POLICY "achievements_write_employee" ON public.achievements FOR INSERT
  WITH CHECK (
    goal_id IN (
      SELECT g.id FROM public.goals g
      JOIN public.goal_sheets gs ON g.goal_sheet_id = gs.id
      WHERE gs.employee_id = auth.uid() AND gs.status = 'approved'
    )
  );
CREATE POLICY "achievements_update_employee" ON public.achievements FOR UPDATE
  USING (
    goal_id IN (
      SELECT g.id FROM public.goals g
      JOIN public.goal_sheets gs ON g.goal_sheet_id = gs.id
      WHERE gs.employee_id = auth.uid() AND gs.status = 'approved'
    )
  );

-- CHECKIN COMMENTS
CREATE POLICY "comments_read" ON public.checkin_comments FOR SELECT USING (true);
CREATE POLICY "comments_manager_write" ON public.checkin_comments FOR INSERT
  WITH CHECK (current_user_role() IN ('manager','admin') AND manager_id = auth.uid());

-- AUDIT LOG
CREATE POLICY "audit_admin_only" ON public.audit_log FOR ALL USING (current_user_role() = 'admin');

-- ESCALATION RULES
CREATE POLICY "escalation_admin_only" ON public.escalation_rules FOR ALL USING (current_user_role() = 'admin');

-- AI PREDICTIONS
CREATE POLICY "predictions_read_own" ON public.ai_predictions FOR SELECT
  USING (
    goal_sheet_id IN (SELECT id FROM public.goal_sheets WHERE employee_id = auth.uid())
    OR current_user_role() IN ('manager','admin')
  );
CREATE POLICY "predictions_write" ON public.ai_predictions FOR INSERT
  WITH CHECK (true);

-- ============ PART C: SEED DATA ================

INSERT INTO public.cycles (name, phase1_open, q1_open, q2_open, q3_open, q4_open, is_active)
VALUES (
  'FY 2025-26',
  '2025-05-01',
  '2025-07-01',
  '2025-10-01',
  '2026-01-01',
  '2026-03-01',
  TRUE
);

INSERT INTO public.thrust_areas (name, department) VALUES
  ('Revenue Growth', 'Sales'),
  ('Customer Satisfaction', 'Customer Success'),
  ('Cost Optimisation', 'Finance'),
  ('Talent Development', 'HR'),
  ('Digital Transformation', 'Technology'),
  ('Safety & Compliance', 'Operations'),
  ('Innovation', 'R&D'),
  ('Market Expansion', 'Business Development');

INSERT INTO public.escalation_rules (trigger_event, days_threshold, notify_skip_level) VALUES
  ('goal_not_submitted', 7, FALSE),
  ('approval_pending', 3, TRUE),
  ('checkin_missed', 5, FALSE);

-- ============ PART D: TEST USERS ================
-- Step 1: Create users in Auth → Authentication → Users:
--   employee@test.com / Test@1234
--   manager@test.com  / Test@1234
--   admin@test.com    / Test@1234
--
-- Step 2: Get their UUIDs:
-- SELECT id, email FROM auth.users ORDER BY created_at;
--
-- Step 3: Replace UUIDs below and run:

-- INSERT INTO public.users (id, name, email, role, department) VALUES
--   ('UUID_MANAGER', 'Rahul Verma', 'manager@test.com', 'manager', 'Engineering'),
--   ('UUID_ADMIN', 'Shalini Agarwal', 'admin@test.com', 'admin', 'HR');
--
-- INSERT INTO public.users (id, name, email, role, manager_id, department) VALUES
--   ('UUID_EMPLOYEE', 'Priya Nair', 'employee@test.com', 'employee', 'UUID_MANAGER', 'Engineering');

-- ============ PART E: VIEWS ================

CREATE OR REPLACE VIEW public.goal_sheets_with_users AS
SELECT
  gs.*,
  u.name AS employee_name,
  u.email AS employee_email,
  u.department,
  u.manager_id,
  c.name AS cycle_name
FROM public.goal_sheets gs
JOIN public.users u ON gs.employee_id = u.id
JOIN public.cycles c ON gs.cycle_id = c.id;

CREATE OR REPLACE VIEW public.goals_with_thrust AS
SELECT
  g.*,
  ta.name AS thrust_area_name
FROM public.goals g
LEFT JOIN public.thrust_areas ta ON g.thrust_area_id = ta.id;
