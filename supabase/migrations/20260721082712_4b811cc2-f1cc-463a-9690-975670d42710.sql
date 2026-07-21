
DROP POLICY IF EXISTS "brain_activity_insert_auth" ON public.brain_activity;
CREATE POLICY "brain_activity_insert_auth" ON public.brain_activity
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
