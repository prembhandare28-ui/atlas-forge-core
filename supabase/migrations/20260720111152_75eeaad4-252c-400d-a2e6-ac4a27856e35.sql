
-- Tighten write policies to admin/manager, keep read open to authenticated
DROP POLICY IF EXISTS "workflows_insert_auth" ON public.workflows;
DROP POLICY IF EXISTS "workflows_update_auth" ON public.workflows;
DROP POLICY IF EXISTS "workflows_delete_auth" ON public.workflows;
CREATE POLICY "workflows_write_admin_manager" ON public.workflows
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "workflow_steps_write_auth" ON public.workflow_steps;
CREATE POLICY "workflow_steps_write_admin_manager" ON public.workflow_steps
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "workflow_assignments_write_auth" ON public.workflow_assignments;
CREATE POLICY "workflow_assignments_write_admin_manager" ON public.workflow_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "workflow_versions_write_auth" ON public.workflow_versions;
CREATE POLICY "workflow_versions_write_admin_manager" ON public.workflow_versions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "workflow_activity_write_auth" ON public.workflow_activity;
CREATE POLICY "workflow_activity_write_authenticated" ON public.workflow_activity
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
