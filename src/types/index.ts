export interface User {
  id: string
  display_name: string
  age: number | null
  country_code: string
  region: string | null
  education_level: string | null
  languages: string[] | null
  raw_self_description: string | null
  created_at: string
}

export interface SkillProfile {
  id: number
  user_id: string
  esco_skill_id: string
  skill_name: string
  skill_category: string | null
  confidence: number
  source: 'self-reported' | 'llm-inferred'
  human_readable_explanation: string | null
  created_at: string
}

export interface RiskAssessment {
  id: number
  user_id: string
  overall_risk_score: number
  risk_band: 'low' | 'medium' | 'high'
  durable_skills: SkillRef[]
  at_risk_skills: SkillRef[]
  recommended_adjacent_skills: AdjacentSkill[]
  explanation: string
  country_calibration: string
  generated_at: string
}

export interface SkillRef {
  esco_skill_id: string
  skill_name: string
  confidence: number
}

export interface AdjacentSkill {
  skill: string
  rationale: string
}

export interface Opportunity {
  id: number
  user_id: string
  isco_code: string
  occupation_name: string
  sector: string
  median_wage_local: number
  median_wage_usd: number
  employment_growth_pct: number
  skill_match_score: number
  opportunity_type: 'formal' | 'self-employment' | 'gig' | 'training'
  reasoning: string
  distance_from_user: 'reachable' | 'stretch' | 'aspirational'
  created_at: string
}

export interface CountryConfig {
  country_code: string
  country_name: string
  primary_language: string
  secondary_languages: string[]
  currency: string
  isco_version: string
  automation_calibration: {
    manual_routine: number
    cognitive_routine: number
    manual_nonroutine: number
  }
  data_sources: {
    wages: string
    employment: string
    macro: string
  }
  informal_economy_share: number
  youth_neet_rate: number
  demo_persona: {
    name: string
    age: number
    region: string
    description_es: string
    description_en: string
  }
}

export interface EscoSkill {
  esco_id: string
  skill_name: string
  skill_category: string
  description: string
}

export interface FreyOsborneEntry {
  isco_code: string
  occupation_name: string
  automation_probability: number
}

export interface WageEntry {
  isco_code: string
  occupation_name: string
  sector: string
  median_monthly_wage_local: number
  median_monthly_wage_usd: number
  year: number
}

export interface EmploymentEntry {
  sector: string
  isco_code: string
  employment_2022: number
  employment_2024: number
  growth_pct: number
}

export interface WdiIndicators {
  country_code: string
  gdp_per_capita_usd: number
  neet_rate: number
  labor_force_participation: number
  informal_economy_share: number
  year: number
}
