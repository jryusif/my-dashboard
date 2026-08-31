-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "segment" TEXT,
    "date" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "time_block" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "time" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "routine_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dental_cases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "patient_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "teeth" TEXT,
    "diagnosis" TEXT,
    "treatment_plan" TEXT,
    "clinical_notes" TEXT,
    "materials_used" TEXT,
    "total_cost" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'In Progress',
    "showcase_for_patients" BOOLEAN NOT NULL DEFAULT false,
    "date" TEXT NOT NULL,
    "photos" JSONB,
    "steps" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dental_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_splits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_name" TEXT NOT NULL,
    "muscle_group" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "workout_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_sets" INTEGER NOT NULL DEFAULT 3,
    "target_reps" TEXT NOT NULL DEFAULT '8-12',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_weight_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_name" TEXT NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "weight_lbs" DOUBLE PRECISION NOT NULL,
    "sets_reps" TEXT,
    "is_pr" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_milestones" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target_horizon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "priority" TEXT NOT NULL DEFAULT 'High',
    "progress_pct" INTEGER NOT NULL DEFAULT 0,
    "key_results" JSONB,
    "action_strategy" TEXT,
    "metrics_target" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT,
    "account" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target_amount" DOUBLE PRECISION NOT NULL,
    "current_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "monthly_budget" DOUBLE PRECISION NOT NULL DEFAULT 3000,
    "savings_target_pct" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Owned',
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "purchase_price" DOUBLE PRECISION,
    "purchase_date" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gold_lots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "karat" TEXT NOT NULL DEFAULT '24k',
    "price_paid" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gold_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tasks_reminder" BOOLEAN NOT NULL DEFAULT true,
    "reports_digest" BOOLEAN NOT NULL DEFAULT true,
    "scheduled_times" JSONB,
    "sound_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link_category" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "tasks_user_id_date_idx" ON "tasks"("user_id", "date");

-- CreateIndex
CREATE INDEX "tasks_user_id_category_idx" ON "tasks"("user_id", "category");

-- CreateIndex
CREATE INDEX "routines_user_id_type_idx" ON "routines"("user_id", "type");

-- CreateIndex
CREATE INDEX "routine_logs_user_id_date_idx" ON "routine_logs"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "routine_logs_user_id_routine_id_date_key" ON "routine_logs"("user_id", "routine_id", "date");

-- CreateIndex
CREATE INDEX "dental_cases_user_id_specialty_idx" ON "dental_cases"("user_id", "specialty");

-- CreateIndex
CREATE INDEX "dental_cases_user_id_patient_code_idx" ON "dental_cases"("user_id", "patient_code");

-- CreateIndex
CREATE UNIQUE INDEX "workout_splits_user_id_day_name_key" ON "workout_splits"("user_id", "day_name");

-- CreateIndex
CREATE INDEX "workout_exercises_user_id_day_name_idx" ON "workout_exercises"("user_id", "day_name");

-- CreateIndex
CREATE INDEX "exercise_weight_logs_user_id_exercise_name_idx" ON "exercise_weight_logs"("user_id", "exercise_name");

-- CreateIndex
CREATE INDEX "exercise_weight_logs_user_id_date_idx" ON "exercise_weight_logs"("user_id", "date");

-- CreateIndex
CREATE INDEX "roadmap_milestones_user_id_pillar_idx" ON "roadmap_milestones"("user_id", "pillar");

-- CreateIndex
CREATE INDEX "roadmap_milestones_user_id_phase_idx" ON "roadmap_milestones"("user_id", "phase");

-- CreateIndex
CREATE INDEX "financial_transactions_user_id_date_idx" ON "financial_transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "financial_transactions_user_id_type_idx" ON "financial_transactions"("user_id", "type");

-- CreateIndex
CREATE INDEX "financial_goals_user_id_idx" ON "financial_goals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_settings_user_id_key" ON "financial_settings"("user_id");

-- CreateIndex
CREATE INDEX "assets_user_id_type_idx" ON "assets"("user_id", "type");

-- CreateIndex
CREATE INDEX "gold_lots_user_id_idx" ON "gold_lots"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "notification_logs_user_id_read_idx" ON "notification_logs"("user_id", "read");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_logs" ADD CONSTRAINT "routine_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_logs" ADD CONSTRAINT "routine_logs_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dental_cases" ADD CONSTRAINT "dental_cases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_splits" ADD CONSTRAINT "workout_splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_weight_logs" ADD CONSTRAINT "exercise_weight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_milestones" ADD CONSTRAINT "roadmap_milestones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_goals" ADD CONSTRAINT "financial_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_settings" ADD CONSTRAINT "financial_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gold_lots" ADD CONSTRAINT "gold_lots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
