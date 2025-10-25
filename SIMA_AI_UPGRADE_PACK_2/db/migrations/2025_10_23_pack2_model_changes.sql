CREATE TABLE IF NOT EXISTS model_changes(id UUID PRIMARY KEY, project_id UUID, change JSONB, delta_score REAL, created_at TIMESTAMPTZ DEFAULT now());
