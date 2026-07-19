-- Extend employee_kind to include hybrid (idempotent)
ALTER TYPE public.employee_kind ADD VALUE IF NOT EXISTS 'hybrid';

-- Revenue category enum
DO $$ BEGIN
  CREATE TYPE public.revenue_category AS ENUM ('sales','marketing','support','operations','research','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Priority enum
DO $$ BEGIN
  CREATE TYPE public.employee_priority AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Experience level enum
DO $$ BEGIN
  CREATE TYPE public.experience_level AS ENUM ('junior','mid','senior','lead','principal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Deployment status enum (future runtime hook)
DO $$ BEGIN
  CREATE TYPE public.deployment_status AS ENUM ('draft','ready','deployed','paused','error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend employees with revenue + AI runtime extension points
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS revenue_goal      numeric(14,2),
  ADD COLUMN IF NOT EXISTS expected_roi      numeric(6,2),
  ADD COLUMN IF NOT EXISTS cost_center       text,
  ADD COLUMN IF NOT EXISTS priority          public.employee_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS revenue_category  public.revenue_category,
  ADD COLUMN IF NOT EXISTS revenue_category_custom text,
  ADD COLUMN IF NOT EXISTS experience_level  public.experience_level,
  ADD COLUMN IF NOT EXISTS notes             text,
  ADD COLUMN IF NOT EXISTS deployment_status public.deployment_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS brain_version     text,
  ADD COLUMN IF NOT EXISTS knowledge_version text,
  ADD COLUMN IF NOT EXISTS workflow_version  text;

CREATE INDEX IF NOT EXISTS employees_revenue_category_idx ON public.employees(revenue_category);
CREATE INDEX IF NOT EXISTS employees_priority_idx ON public.employees(priority);
CREATE INDEX IF NOT EXISTS employees_deployment_status_idx ON public.employees(deployment_status);