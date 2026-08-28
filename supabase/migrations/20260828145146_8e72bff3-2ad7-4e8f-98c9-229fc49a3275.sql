CREATE OR REPLACE FUNCTION public.can_access_mission_run(_mission_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mission_runs m WHERE m.id = _mission_id
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_mission_run(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_mission_run(uuid) TO authenticated, service_role;
