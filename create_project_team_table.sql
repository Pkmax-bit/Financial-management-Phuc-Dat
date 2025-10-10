-- Create project team table
CREATE TABLE public.project_team (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name character varying(255) NOT NULL,
  role character varying(100) NOT NULL,
  email character varying(255) NULL,
  phone character varying(20) NULL,
  start_date date NOT NULL,
  hourly_rate numeric(10, 2) NULL,
  status character varying(20) NULL DEFAULT 'active'::character varying,
  skills text[] NULL,
  avatar text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  user_id uuid NULL,
  CONSTRAINT project_team_pkey PRIMARY KEY (id),
  CONSTRAINT project_team_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT project_team_status_check CHECK (
    (status)::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[])
  )
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_team_project_id ON public.project_team USING btree (project_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_project_team_status ON public.project_team USING btree (status) TABLESPACE pg_default;
