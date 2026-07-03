
-- Enable trigram search (must exist before creating a gin_trgm_ops index)
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Enums
CREATE TYPE public.employment_type AS ENUM ('full_time','part_time','contract','intern','consultant');
CREATE TYPE public.employee_status AS ENUM ('active','inactive','on_leave','archived');
CREATE TYPE public.employee_kind AS ENUM ('human','ai');

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any authenticated user can view departments"
  ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can insert departments"
  ON public.departments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins and managers can update departments"
  ON public.departments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins can delete departments"
  ON public.departments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE SEQUENCE public.employee_code_seq START 1001;

CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind public.employee_kind NOT NULL DEFAULT 'human',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  role_title TEXT,
  manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  location TEXT,
  timezone TEXT,
  bio TEXT,
  responsibilities TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.employee_status NOT NULL DEFAULT 'active',
  last_active_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX employees_department_idx ON public.employees(department_id);
CREATE INDEX employees_manager_idx ON public.employees(manager_id);
CREATE INDEX employees_status_idx ON public.employees(status);
CREATE INDEX employees_kind_idx ON public.employees(kind);
CREATE INDEX employees_full_name_trgm_idx
  ON public.employees USING gin (full_name extensions.gin_trgm_ops);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any authenticated user can view employees"
  ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers can create employees"
  ON public.employees FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins and managers can update employees"
  ON public.employees FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "Admins can delete employees"
  ON public.employees FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto employee_code + created_by
CREATE OR REPLACE FUNCTION public.assign_employee_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.employee_code IS NULL OR NEW.employee_code = '' THEN
    NEW.employee_code := 'EMP-' || nextval('public.employee_code_seq');
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_employees_assign_code
  BEFORE INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.assign_employee_code();

-- Audit trigger
CREATE OR REPLACE FUNCTION public.log_employee_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE action_name TEXT; meta JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'employee.created';
    meta := jsonb_build_object('employee_id', NEW.id, 'full_name', NEW.full_name);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.department_id IS DISTINCT FROM OLD.department_id THEN
      action_name := 'employee.department_changed';
      meta := jsonb_build_object('employee_id', NEW.id, 'from', OLD.department_id, 'to', NEW.department_id);
    ELSIF NEW.role_title IS DISTINCT FROM OLD.role_title THEN
      action_name := 'employee.role_changed';
      meta := jsonb_build_object('employee_id', NEW.id, 'from', OLD.role_title, 'to', NEW.role_title);
    ELSIF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
      action_name := 'employee.photo_updated';
      meta := jsonb_build_object('employee_id', NEW.id);
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      action_name := 'employee.status_changed';
      meta := jsonb_build_object('employee_id', NEW.id, 'from', OLD.status, 'to', NEW.status);
    ELSE
      action_name := 'employee.updated';
      meta := jsonb_build_object('employee_id', NEW.id);
    END IF;
  ELSE
    action_name := 'employee.deleted';
    meta := jsonb_build_object('employee_id', OLD.id, 'full_name', OLD.full_name);
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), action_name, 'employee',
          COALESCE(NEW.id::text, OLD.id::text), meta);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_employees_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.log_employee_change();

-- Allow SECURITY DEFINER trigger to insert into audit_logs
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated actors can insert audit rows"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);
