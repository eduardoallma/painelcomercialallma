
CREATE TABLE public.roleplay_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Sessão sem título',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  playbook_ids uuid[] DEFAULT '{}',
  score smallint,
  bant_feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roleplay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions"
  ON public.roleplay_sessions FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.validate_roleplay_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.score IS NOT NULL AND (NEW.score < 0 OR NEW.score > 10) THEN
    RAISE EXCEPTION 'Score must be between 0 and 10';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_roleplay_score_trigger
  BEFORE INSERT OR UPDATE ON public.roleplay_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_roleplay_score();
