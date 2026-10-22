// Types matching FastAPI Pydantic schemas exactly

export type ProjectStatus =
  | 'draft'
  | 'analyzed'
  | 'approved'
  | 'rejected'
  | 'in_delivery'
  | 'completed';

export type FeasibilityStatus =
  | 'feasible'
  | 'feasible_with_conditions'
  | 'not_feasible'
  | 'insufficient_information';

export type SeverityLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface MetaPayload {
  timestamp: string;
  request_id?: string;
  version: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: MetaPayload;
}

export interface ProjectCreate {
  org_id?: string;
  title: string;
  description: string;
  business_objectives: string;
  target_architecture?: string;
  target_completion_date: string; // YYYY-MM-DD
  budget_amount: number;
  currency?: string;
  team_size_limit?: number;
}

export interface ProjectResponse extends ProjectCreate {
  project_id: string;
  org_id: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface EvidenceProvenance {
  record_type: string;
  record_id: string;
  field_name: string;
  observed_value: any;
  required_value: any;
  citation: string;
}

export interface RiskItemResponse {
  risk_id: string;
  risk_rule_id?: string | null;
  dimension: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  likelihood: SeverityLevel;
  evidence_provenance: EvidenceProvenance;
  affected_requirement_id?: string | null;
  potential_impact: string;
  suggested_mitigation: string;
  owner_role: string;
  confidence_level: string;
}

export interface FeasibilityReportResponse {
  report_id: string;
  run_id: string;
  project_id: string;
  overall_status: FeasibilityStatus;
  overall_score: number; // 0.0 to 100.0
  completeness_score: number;
  technical_complexity_score: number;
  org_capability_score: number;
  estimated_effort_hours_optimistic: number;
  estimated_effort_hours_nominal: number;
  estimated_effort_hours_pessimistic: number;
  estimated_cost_nominal: number;
  estimated_duration_days_nominal: number;
  executive_summary: string;
  risks: RiskItemResponse[];
  recommended_action: string;
  pre_approval_conditions: string[];
}
