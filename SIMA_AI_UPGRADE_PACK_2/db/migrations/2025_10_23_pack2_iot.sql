CREATE TABLE IF NOT EXISTS sensor_data(id UUID PRIMARY KEY, project_id UUID, sensor_type TEXT, val REAL, ts TIMESTAMPTZ DEFAULT now());
