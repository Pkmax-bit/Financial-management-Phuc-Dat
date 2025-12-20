-- Add responsibility_type column to project_team table
-- This column stores the RACI matrix responsibility type (accountable, responsible, consulted, informed)

ALTER TABLE public.project_team
ADD COLUMN IF NOT EXISTS responsibility_type VARCHAR(20) DEFAULT 'informed';

-- Add CHECK constraint to ensure only valid responsibility types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'project_team_responsibility_type_check'
  ) THEN
    ALTER TABLE public.project_team
    ADD CONSTRAINT project_team_responsibility_type_check 
    CHECK (responsibility_type IN ('accountable', 'responsible', 'consulted', 'informed'));
  END IF;
END $$;

-- Update existing records to have default value if NULL
UPDATE public.project_team
SET responsibility_type = 'informed'
WHERE responsibility_type IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.project_team.responsibility_type IS 'RACI matrix responsibility type: accountable, responsible, consulted, or informed';

