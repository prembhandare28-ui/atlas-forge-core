
CREATE POLICY "Signed-in users can view employee photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-photos');

CREATE POLICY "Admins and managers can upload employee photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'employee-photos'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  );

CREATE POLICY "Admins and managers can update employee photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  );

CREATE POLICY "Admins and managers can delete employee photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  );
