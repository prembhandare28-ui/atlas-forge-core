
-- The audit trigger is SECURITY DEFINER and inserts as the table owner,
-- which bypasses RLS. Drop the permissive insert policy that was only
-- there as a safety net.
DROP POLICY IF EXISTS "Authenticated actors can insert audit rows" ON public.audit_logs;

-- Revoke direct execute on internal helper functions. RLS policies and
-- triggers still call them because policy evaluation and trigger
-- execution do not require EXECUTE for the calling role.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_employee_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_employee_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
