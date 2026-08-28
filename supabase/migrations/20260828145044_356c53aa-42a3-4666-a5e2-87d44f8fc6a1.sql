-- ATLAS Autonomous Mission Execution: persistent mission runs
CREATE TYPE public.mission_run_status AS ENUM (
  'planning','ready','running','waiting_for_human','waiting_for_approval','blocked','failed','completed','cancelled'
);

CREATE TYPE public.mission_step_status AS ENUM (
  'pending','running','waiting_for_human','waiting_for_approval','blocked','failed','skipped','completed'
);

CREATE TYPE public.mission_executor_kind AS ENUM (
  'ai_brain','skill','tool','workflow','employee','human','system'
);

CREATE TABLE public.mission_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_text text NOT NULL,
  title text NOT NULL,
  objective text,
  desired_outcome text,
  constraints jsonb NOT NULL DEFAULT '[]'::jsonb,
  success_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  priority public.employee_priority NOT NULL DEFAULT 'medium',
  deadline timestamptz,
  status public.mission_run_status NOT NULL DEFAULT 'planning',
  progress_percent integer NOT NULL DEFAULT 0,
  current_action text,
  clarification_question text,
  plan_rationale text,
  result jsonb,
  summary text,
  verification jsonb,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE public.mission_run_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.mission_runs(id) ON DELETE CASCADE,
  order_index integer NOT NULL,
  title text NOT NULL,
  description text,
  executor_kind public.mission_executor_kind NOT NULL DEFAULT 'system',
  executor_id uuid,
  executor_label text,
  capability_available boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT false,
  status public.mission_step_status NOT NULL DEFAULT 'pending',
  instruction text,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error text,
  retry_count integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mission_run_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.mission_runs(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.mission_run_steps(id) ON DELETE CASCADE,
  kind text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.mission_run_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.mission_runs(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','atlas')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mission_run_steps_mission_idx ON public.mission_run_steps(mission_id, order_index);
CREATE INDEX mission_run_events_mission_idx ON public.mission_run_events(mission_id, created_at DESC);
CREATE INDEX mission_run_messages_mission_idx ON public.mission_run_messages(mission_id, created_at);
CREATE INDEX mission_runs_owner_idx ON public.mission_runs(created_by, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_runs TO authenticated;
GRANT ALL ON public.mission_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mission_run_steps TO authenticated;
GRANT ALL ON public.mission_run_steps TO service_role;
GRANT SELECT, INSERT ON public.mission_run_events TO authenticated;
GRANT ALL ON public.mission_run_events TO service_role;
GRANT SELECT, INSERT ON public.mission_run_messages TO authenticated;
GRANT ALL ON public.mission_run_messages TO service_role;

ALTER TABLE public.mission_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_run_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_run_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_runs_select" ON public.mission_runs FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mission_runs_insert" ON public.mission_runs FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "mission_runs_update" ON public.mission_runs FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mission_runs_delete" ON public.mission_runs FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.can_access_mission_run(_mission_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mission_runs m
    WHERE m.id = _mission_id
      AND (m.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );
$$;

CREATE POLICY "mission_run_steps_select" ON public.mission_run_steps FOR SELECT TO authenticated
  USING (public.can_access_mission_run(mission_id));
CREATE POLICY "mission_run_steps_write" ON public.mission_run_steps FOR ALL TO authenticated
  USING (public.can_access_mission_run(mission_id))
  WITH CHECK (public.can_access_mission_run(mission_id));

CREATE POLICY "mission_run_events_select" ON public.mission_run_events FOR SELECT TO authenticated
  USING (public.can_access_mission_run(mission_id));
CREATE POLICY "mission_run_events_insert" ON public.mission_run_events FOR INSERT TO authenticated
  WITH CHECK (public.can_access_mission_run(mission_id));

CREATE POLICY "mission_run_messages_select" ON public.mission_run_messages FOR SELECT TO authenticated
  USING (public.can_access_mission_run(mission_id));
CREATE POLICY "mission_run_messages_insert" ON public.mission_run_messages FOR INSERT TO authenticated
  WITH CHECK (public.can_access_mission_run(mission_id));

CREATE TRIGGER mission_runs_updated_at BEFORE UPDATE ON public.mission_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER mission_run_steps_updated_at BEFORE UPDATE ON public.mission_run_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
