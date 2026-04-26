-- UNMAPPED — Supabase schema
-- Run this in Supabase SQL Editor on a fresh project.

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    age INTEGER,
    country_code TEXT NOT NULL,
    region TEXT,
    education_level TEXT,
    languages JSONB,
    raw_self_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skills_profile (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    esco_skill_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    skill_category TEXT,
    confidence REAL CHECK (confidence BETWEEN 0 AND 1),
    source TEXT,
    human_readable_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE risk_assessments (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    overall_risk_score REAL,
    risk_band TEXT,
    durable_skills JSONB,
    at_risk_skills JSONB,
    recommended_adjacent_skills JSONB,
    explanation TEXT,
    country_calibration TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE opportunities (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    isco_code TEXT,
    occupation_name TEXT,
    sector TEXT,
    median_wage_local REAL,
    median_wage_usd REAL,
    employment_growth_pct REAL,
    skill_match_score REAL,
    opportunity_type TEXT,
    reasoning TEXT,
    distance_from_user TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE country_configs (
    country_code TEXT PRIMARY KEY,
    country_name TEXT,
    primary_language TEXT,
    currency_code TEXT,
    isco_version TEXT,
    automation_calibration JSONB,
    primary_data_sources JSONB,
    informal_economy_share REAL,
    youth_neet_rate REAL
);

INSERT INTO country_configs VALUES
  ('PER','Peru','es','PEN','ISCO-08',
   '{"manual_routine":0.7,"cognitive_routine":0.85,"manual_nonroutine":0.95}'::jsonb,
   '["ILO Peru","INEI","World Bank WDI"]'::jsonb, 0.75, 0.18),
  ('GHA','Ghana','en','GHS','ISCO-08',
   '{"manual_routine":0.6,"cognitive_routine":0.8,"manual_nonroutine":0.95}'::jsonb,
   '["ILO Ghana","GSS","World Bank WDI"]'::jsonb, 0.85, 0.30);

-- Hackathon shortcut: disable RLS (service role key bypasses RLS anyway)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE skills_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE country_configs DISABLE ROW LEVEL SECURITY;
