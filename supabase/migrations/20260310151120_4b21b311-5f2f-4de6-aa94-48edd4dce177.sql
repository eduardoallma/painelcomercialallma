
-- Drop the ALL policy and create separate ones
DROP POLICY IF EXISTS "Users manage own playbook files" ON storage.objects;

CREATE POLICY "playbooks_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'playbooks' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "playbooks_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'playbooks' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "playbooks_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'playbooks' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "playbooks_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'playbooks' AND (storage.foldername(name))[1] = auth.uid()::text);
