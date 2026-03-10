
CREATE TABLE public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own playbooks"
  ON public.playbooks FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

INSERT INTO storage.buckets (id, name, public) VALUES ('playbooks', 'playbooks', false);

CREATE POLICY "Users manage own playbook files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'playbooks' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'playbooks' AND (storage.foldername(name))[1] = auth.uid()::text);
