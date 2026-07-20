
-- Enums
CREATE TYPE public.workflow_category AS ENUM (
  'sales','marketing','customer_success','support','operations','finance','hr','research','custom'
);
CREATE TYPE public.workflow_status AS ENUM ('draft','active','paused','archived');
CREATE TYPE public.workflow_trigger_type AS ENUM (
  'manual','schedule','webhook','crm_event','email_event','customer_event'
);
CREATE TYPE public.workflow_step_type AS ENUM (
  'task','approval','decision','notification','delay','integration'
);
CREATE TYPE public.workflow_assignment_role AS ENUM ('owner','assignee','reviewer');

-- ============ workflows ============
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  category public.workflow_category NOT NULL DEFAULT 'operations',
  priority public.employee_priority NOT NULL DEFAULT 'medium',
  status public.workflow_status NOT NULL DEFAULT 'draft',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_type public.workflow_trigger_type NOT NULL DEFAULT 'manual',
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimated_duration_minutes INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO service_role;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflows_read_auth" ON public.workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY "workflows_insert_auth" ON public.workflows FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "workflows_update_auth" ON public.workflows FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "workflows_delete_auth" ON public.workflows FOR DELETE TO authenticated USING (true);
CREATE INDEX workflows_department_idx ON public.workflows(department_id);
CREATE INDEX workflows_status_idx ON public.workflows(status);
CREATE INDEX workflows_category_idx ON public.workflows(category);
CREATE TRIGGER workflows_set_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ workflow_steps ============
CREATE TABLE public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  step_type public.workflow_step_type NOT NULL DEFAULT 'task',
  estimated_minutes INTEGER,
  assigned_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_steps TO authenticated;
GRANT ALL ON public.workflow_steps TO service_role;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_steps_read_auth" ON public.workflow_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "workflow_steps_write_auth" ON public.workflow_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX workflow_steps_workflow_idx ON public.workflow_steps(workflow_id, order_index);
CREATE TRIGGER workflow_steps_set_updated_at
  BEFORE UPDATE ON public.workflow_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ workflow_assignments ============
CREATE TABLE public.workflow_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role public.workflow_assignment_role NOT NULL DEFAULT 'assignee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, employee_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_assignments TO authenticated;
GRANT ALL ON public.workflow_assignments TO service_role;
ALTER TABLE public.workflow_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_assignments_read_auth" ON public.workflow_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "workflow_assignments_write_auth" ON public.workflow_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX workflow_assignments_workflow_idx ON public.workflow_assignments(workflow_id);
CREATE INDEX workflow_assignments_employee_idx ON public.workflow_assignments(employee_id);

-- ============ workflow_versions ============
CREATE TABLE public.workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_versions TO authenticated;
GRANT ALL ON public.workflow_versions TO service_role;
ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_versions_read_auth" ON public.workflow_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "workflow_versions_write_auth" ON public.workflow_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX workflow_versions_workflow_idx ON public.workflow_versions(workflow_id, version DESC);

-- ============ workflow_activity ============
CREATE TABLE public.workflow_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_activity TO authenticated;
GRANT ALL ON public.workflow_activity TO service_role;
ALTER TABLE public.workflow_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_activity_read_auth" ON public.workflow_activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "workflow_activity_write_auth" ON public.workflow_activity FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX workflow_activity_workflow_idx ON public.workflow_activity(workflow_id, created_at DESC);
