CREATE TYPE "public"."budget_category" AS ENUM('overall', 'food', 'transport', 'utilities', 'entertainment', 'shopping', 'health', 'education', 'other');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('food', 'transport', 'utilities', 'entertainment', 'shopping', 'health', 'education', 'other');--> statement-breakpoint
CREATE TYPE "public"."income_frequency" AS ENUM('one-time', 'monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."income_source" AS ENUM('salary', 'business', 'freelance', 'bonus', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('cash', 'upi', 'card', 'netbanking');--> statement-breakpoint
CREATE TYPE "public"."recurring_period" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."scope" AS ENUM('user', 'household');--> statement-breakpoint
CREATE TYPE "public"."subscription_category" AS ENUM('entertainment', 'utility', 'productivity', 'health', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscription_frequency" AS ENUM('monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"householdId" uuid NOT NULL,
	"userId" uuid,
	"scope" "scope" NOT NULL,
	"category" "budget_category" NOT NULL,
	"monthlyLimit" numeric(12, 2) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"householdId" uuid NOT NULL,
	"userId" uuid,
	"scope" "scope" NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🎉' NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"householdId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" "expense_category" NOT NULL,
	"description" text NOT NULL,
	"date" date NOT NULL,
	"isRecurring" boolean DEFAULT false NOT NULL,
	"recurringPeriod" "recurring_period",
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"paymentMode" "payment_mode" DEFAULT 'upi' NOT NULL,
	"customFields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"eventId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grocery_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"householdId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"date" date NOT NULL,
	"items" jsonb NOT NULL,
	"totalAmount" numeric(12, 2) NOT NULL,
	"store" text,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"householdId" uuid NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"householdId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"source" "income_source" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"frequency" "income_frequency" DEFAULT 'monthly' NOT NULL,
	"description" text NOT NULL,
	"date" date NOT NULL,
	"customFields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"householdId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"frequency" "subscription_frequency" DEFAULT 'monthly' NOT NULL,
	"renewalDate" date NOT NULL,
	"category" "subscription_category" DEFAULT 'other' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_householdId_households_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_household_members_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_householdId_households_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_userId_household_members_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_householdId_households_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_household_members_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_eventId_events_id_fk" FOREIGN KEY ("eventId") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_entries" ADD CONSTRAINT "grocery_entries_householdId_households_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_entries" ADD CONSTRAINT "grocery_entries_userId_household_members_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_householdId_households_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_householdId_households_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_userId_household_members_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_householdId_households_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_household_members_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_household_id_idx" ON "budgets" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "events_household_id_idx" ON "events" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "events_user_id_idx" ON "events" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "expenses_household_id_idx" ON "expenses" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "expenses_user_id_idx" ON "expenses" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "expenses_event_id_idx" ON "expenses" USING btree ("eventId");--> statement-breakpoint
CREATE INDEX "grocery_entries_household_id_idx" ON "grocery_entries" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "grocery_entries_user_id_idx" ON "grocery_entries" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "grocery_entries_date_idx" ON "grocery_entries" USING btree ("date");--> statement-breakpoint
CREATE INDEX "household_members_household_id_idx" ON "household_members" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "incomes_household_id_idx" ON "incomes" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "incomes_user_id_idx" ON "incomes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "incomes_date_idx" ON "incomes" USING btree ("date");--> statement-breakpoint
CREATE INDEX "subscriptions_household_id_idx" ON "subscriptions" USING btree ("householdId");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("userId");