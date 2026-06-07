-- Tie household_members.id to Supabase auth.users.id so a deleted auth user
-- cascades to the profile (and from there, via the existing FKs, to all their data).
ALTER TABLE "household_members"
  ADD CONSTRAINT "household_members_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES auth.users("id") ON DELETE CASCADE;
--> statement-breakpoint

-- Scope/userId invariants — mirror the Zod superRefine rules at the DB level.
ALTER TABLE "budgets"
  ADD CONSTRAINT "budgets_scope_user_chk"
  CHECK (
    (scope = 'user' AND "userId" IS NOT NULL) OR
    (scope = 'household' AND "userId" IS NULL)
  );
--> statement-breakpoint

ALTER TABLE "events"
  ADD CONSTRAINT "events_scope_user_chk"
  CHECK (
    (scope = 'user' AND "userId" IS NOT NULL) OR
    (scope = 'household' AND "userId" IS NULL)
  );
--> statement-breakpoint

-- endDate >= startDate (NULL endDate means open-ended, allowed).
ALTER TABLE "events"
  ADD CONSTRAINT "events_end_after_start_chk"
  CHECK ("endDate" IS NULL OR "endDate" >= "startDate");
--> statement-breakpoint

-- One budget per (household, scope, category) pair — for user scope, also keyed by userId.
-- Two partial unique indexes implement the COALESCE-style upsert key for budgets.setBudget Server Action.
CREATE UNIQUE INDEX "budgets_user_scope_unique"
  ON "budgets" ("householdId", "userId", "category")
  WHERE scope = 'user';
--> statement-breakpoint

CREATE UNIQUE INDEX "budgets_household_scope_unique"
  ON "budgets" ("householdId", "category")
  WHERE scope = 'household';
--> statement-breakpoint

-- Row-Level Security. Policy: a row is visible iff its householdId matches the
-- household of the calling auth user (looked up via household_members).
ALTER TABLE "households"         ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "household_members"  ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "expenses"           ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "incomes"            ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "subscriptions"      ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "grocery_entries"    ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "budgets"            ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "events"             ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Helper: current user's household id. STABLE so the planner can cache per-statement.
CREATE OR REPLACE FUNCTION public.current_household_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "householdId" FROM public.household_members WHERE id = auth.uid()
$$;
--> statement-breakpoint

-- households: visible only to your own household
CREATE POLICY "households_household_isolation" ON "households"
  FOR ALL TO authenticated
  USING (id = public.current_household_id())
  WITH CHECK (id = public.current_household_id());
--> statement-breakpoint

-- household_members: visible to everyone in the same household; only the row owner can update/delete themselves
CREATE POLICY "members_read_same_household" ON "household_members"
  FOR SELECT TO authenticated
  USING ("householdId" = public.current_household_id());
--> statement-breakpoint
CREATE POLICY "members_self_update" ON "household_members"
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
--> statement-breakpoint

-- Domain tables: full CRUD inside your household, nothing outside.
CREATE POLICY "expenses_household_isolation" ON "expenses"
  FOR ALL TO authenticated
  USING ("householdId" = public.current_household_id())
  WITH CHECK ("householdId" = public.current_household_id());
--> statement-breakpoint
CREATE POLICY "incomes_household_isolation" ON "incomes"
  FOR ALL TO authenticated
  USING ("householdId" = public.current_household_id())
  WITH CHECK ("householdId" = public.current_household_id());
--> statement-breakpoint
CREATE POLICY "subscriptions_household_isolation" ON "subscriptions"
  FOR ALL TO authenticated
  USING ("householdId" = public.current_household_id())
  WITH CHECK ("householdId" = public.current_household_id());
--> statement-breakpoint
CREATE POLICY "grocery_entries_household_isolation" ON "grocery_entries"
  FOR ALL TO authenticated
  USING ("householdId" = public.current_household_id())
  WITH CHECK ("householdId" = public.current_household_id());
--> statement-breakpoint
CREATE POLICY "budgets_household_isolation" ON "budgets"
  FOR ALL TO authenticated
  USING ("householdId" = public.current_household_id())
  WITH CHECK ("householdId" = public.current_household_id());
--> statement-breakpoint
CREATE POLICY "events_household_isolation" ON "events"
  FOR ALL TO authenticated
  USING ("householdId" = public.current_household_id())
  WITH CHECK ("householdId" = public.current_household_id());
