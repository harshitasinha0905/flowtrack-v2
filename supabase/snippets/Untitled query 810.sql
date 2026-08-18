DROP POLICY "Enable delete for authenticated users"
ON public.tasks;

CREATE POLICY "Admins can delete all tasks, creators can delete own"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);