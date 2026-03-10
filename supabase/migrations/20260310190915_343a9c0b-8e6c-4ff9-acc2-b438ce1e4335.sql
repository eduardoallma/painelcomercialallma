
CREATE OR REPLACE FUNCTION public.validate_roleplay_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.score IS NOT NULL AND (NEW.score < 0 OR NEW.score > 10) THEN
    RAISE EXCEPTION 'Score must be between 0 and 10';
  END IF;
  RETURN NEW;
END;
$$;
