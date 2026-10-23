// DevMatrix AI — Shared Contract TypeScript Definitions
// Aligned 1-to-1 with backend/schemas.py

export type ProjectStatus =
  | 'submitted'
  | 'analyzed'
  | 'approved'
  | 'team_assigned'
  | 'in_delivery'
  | 'completed';

export type FeasibilityVerdict = 'feasible' | 'conditional' | 'not_feasible';

export type RequirementType = 'functional' | 'non_functional';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type ComplexityLevel = 'low' | 'medium' | 'high';
export type RiskSeverity = 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'in_progress' | 'done';

export interface RequirementItem {
  id: number;
  text: string;
  type: RequirementType;
  priority: PriorityLevel;
  complexity: ComplexityLevel;
  integration: boolean;
}

export interface RiskItem {
  title: string;
  severity: RiskSeverity;
  mitigation: string;
}

export interface RequiredSkillItem {
  name: string;
  mandatory: boolean;
}

export interface MilestoneItem {
  name: string;
  weeks: number;
}

export interface CalculationDetail {
  total_points: number;
  person_weeks: number;
  integrations: number;
  integration_overhead: number;
  effective_developers: number;
  calendar_weeks: number;
  min_weeks: number;
  max_weeks: number;
  min_cost: number;
  max_cost: number;
  buffer_min: number;
  buffer_max: number;
  rate_per_week: number;
  historical_adjustment_applied: boolean;
  historical_overrun_pct: number;
  historical_project_count: number;
  deadline_weeks: number;
  budget_max: number;
  base_verdict: string;
  budget_downgrade: boolean;
  risk_downgrade: boolean;
  verdict: FeasibilityVerdict;
  rule_fired: string;
  reason: string;
}

export interface AnalysisResponse {
  id: string;
  project_id: string;
  is_baseline: boolean;
  summary: string;
  requirements: RequirementItem[];
  gaps: string[];
  conflicts: string[];
  risks: RiskItem[];
  required_skills: RequiredSkillItem[];
  tech_stack: string[];
  milestones: MilestoneItem[];
  calculation: CalculationDetail;
  created_at: string;
}

export interface ProjectListItem {
  id: string;
  title: string;
  client: string;
  status: ProjectStatus;
  verdict?: FeasibilityVerdict;
  effort_min_weeks?: number;
  effort_max_weeks?: number;
  cost_min?: number;
  cost_max?: number;
  deadline_weeks: number;
  budget_min: number;
  budget_max: number;
  updated_at: string;
  created_at: string;
}

export interface ProjectDetailResponse {
  id: string;
  title: string;
  client: string;
  deadline_weeks: number;
  budget_min: number;
  budget_max: number;
  tech_stack: string[];
  notes?: string;
  raw_text: string;
  status: ProjectStatus;
  verdict?: FeasibilityVerdict;
  effort_min_weeks?: number;
  effort_max_weeks?: number;
  cost_min?: number;
  cost_max?: number;
  sim_offset_days: number;
  actual_weeks?: number;
  actual_cost?: number;
  approved_by?: string;
  approval_notes?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  analysis?: AnalysisResponse;
}

export interface DeveloperProfile {
  id: string;
  name: string;
  role: string;
  experience_years: number;
  skills: Record<string, number>;
  free_capacity_pct: number;
  flagged_skills: string[];
}

export interface TeamMemberAssigned {
  developer_id: string;
  name: string;
  role: string;
  allocated_capacity_pct: number;
  skills: Record<string, number>;
  reason: string;
}

export interface AlternativeTeamOption {
  team: TeamMemberAssigned[];
  tradeoff: string;
  score: number;
  skills_covered_pct: number;
}

export interface TeamRecommendationResponse {
  project_id: string;
  best_team: TeamMemberAssigned[];
  alternative: AlternativeTeamOption;
  mandatory_skills_covered: number;
  total_mandatory_skills: number;
  coverage_pct: number;
  capacity_violations: string[];
  uncovered_skills: string[];
  explanation: string;
}

export interface TaskItem {
  id: string;
  project_id: string;
  title: string;
  milestone_name: string;
  status: TaskStatus;
  owner_name: string;
  owner_id: string;
  due_date: string;
  estimated_hours: number;
  logged_hours: number;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

export interface AlertItem {
  task_id: string;
  task_name: string;
  severity: RiskSeverity;
  rule: string;
  message: string;
}

export interface HistoricalProjectItem {
  id: string;
  name: string;
  estimated_weeks: number;
  actual_weeks: number;
  estimated_cost: number;
  actual_cost: number;
  overrun_pct: number;
  domain: string;
  is_seed: boolean;
}

export interface HistoryResponse {
  average_overrun_pct: number;
  project_count: number;
  projects: HistoricalProjectItem[];
}


export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  role: string;
  provider: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
