import type { ProjectResponse, FeasibilityReportResponse } from '../types/api';

export const FALLBACK_MOCK_PROJECT: ProjectResponse = {
  project_id: 'PRJ-101',
  org_id: 'ORG-001',
  title: 'ShopNova E-Commerce Suite',
  description: 'Multi-vendor marketplace platform with product search, cart, checkout, Stripe payment integration, order tracking, and seller management.',
  business_objectives: 'Expand digital retail revenue by 40% with high-throughput order engine.',
  target_architecture: 'Microservices with PostgreSQL, Redis, FastAPI, and React',
  target_completion_date: '2026-12-15',
  budget_amount: 85000.0,
  currency: 'USD',
  team_size_limit: 5,
  status: 'draft',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const FALLBACK_MOCK_REPORT: FeasibilityReportResponse = {
  report_id: 'REP-701',
  run_id: 'RUN-501',
  project_id: 'PRJ-101',
  overall_status: 'feasible_with_conditions',
  overall_score: 59.58,
  completeness_score: 55.0,
  technical_complexity_score: 85.0,
  org_capability_score: 25.0,
  estimated_effort_hours_optimistic: 420.0,
  estimated_effort_hours_nominal: 540.0,
  estimated_effort_hours_pessimistic: 720.0,
  estimated_cost_nominal: 44700.0,
  estimated_duration_days_nominal: 65,
  executive_summary: "Project 'ShopNova E-Commerce Suite' feasibility evaluated against organizational baseline: Overall Risk Score is 59.6/100 (Feasible With Conditions). Budget is viable ($44,700.00 estimated vs $85,000.00 budget ceiling), but severe skill deficits in PCI payment integration and Lead Backend Engineer capacity conflicts require satisfying pre-approval conditions.",
  risks: [
    {
      risk_id: 'RUN-501-RSK-901',
      risk_rule_id: 'RSK-901',
      dimension: 'completeness',
      title: 'Unspecified Peak Concurrency & Traffic Specifications',
      description: 'Requirement REQ-206 lacks peak transactions/sec (RPS) and concurrency ceilings.',
      severity: 'high',
      likelihood: 'high',
      evidence_provenance: {
        record_type: 'project_requirements',
        record_id: 'REQ-206',
        field_name: 'is_ambiguous',
        observed_value: true,
        required_value: false,
        citation: 'REQ-206 flagged with ambiguity_flag=True; missing peak RPS parameters'
      },
      affected_requirement_id: 'REQ-206',
      potential_impact: 'Database connection pool exhaustion and auto-scaling thrashing under production flash sales.',
      suggested_mitigation: 'Obtain written signoff on peak RPS SLA (Clarification CLR-301) before architecture freeze.',
      owner_role: 'Lead Architect',
      confidence_level: 'high'
    },
    {
      risk_id: 'RUN-501-RSK-902',
      risk_rule_id: 'RSK-902',
      dimension: 'skill_fit',
      title: 'Expertise Gap on Payment Gateway & 3D-Secure 2.0 Integration',
      description: 'Requirement requires skill SKL-105 at minimum proficiency 4, but best in-house proficiency is 2.',
      severity: 'high',
      likelihood: 'high',
      evidence_provenance: {
        record_type: 'employee_skills',
        record_id: 'EMP-001',
        field_name: 'proficiency_level',
        observed_value: 2,
        required_value: 4,
        citation: 'Skill SKL-105 deficit: best internal coverage is EMP-001 (Proficiency 2) vs required 4'
      },
      affected_requirement_id: 'REQ-201',
      potential_impact: 'Delays and critical security bugs in payment and compliance modules.',
      suggested_mitigation: 'Onboard verified external contractor specialist for payment module.',
      owner_role: 'Engineering Manager',
      confidence_level: 'high'
    },
    {
      risk_id: 'RUN-501-RSK-903',
      risk_rule_id: 'RSK-903',
      dimension: 'capacity',
      title: 'Backend Lead Bandwidth Deficit',
      description: 'Lead Backend Engineer Arjun Mehta has only 10.0h/week remaining capacity due to existing assignment on PRJ-090, but project requires 28.2h/week.',
      severity: 'critical',
      likelihood: 'high',
      evidence_provenance: {
        record_type: 'employee_availability',
        record_id: 'EMP-001',
        field_name: 'remaining_hours',
        observed_value: 10.0,
        required_value: 28.2,
        citation: 'Arjun Mehta (EMP-001) has 10.0h/week remaining capacity vs 28.2h/week required'
      },
      affected_requirement_id: 'REQ-201',
      potential_impact: 'Critical bottleneck delaying all dependent core service milestones by 3+ weeks.',
      suggested_mitigation: 'Reallocate 15h/week of Arjun Mehta from PRJ-090 or onboard external backend engineer.',
      owner_role: 'Engineering Manager',
      confidence_level: 'high'
    },
    {
      risk_id: 'RUN-501-RSK-904',
      risk_rule_id: 'RSK-904',
      dimension: 'infrastructure',
      title: 'Unconfirmed License Prerequisite: Elasticsearch Enterprise License',
      description: "Infrastructure resource Elasticsearch Enterprise License (RES-403) has status 'unconfirmed'.",
      severity: 'medium',
      likelihood: 'medium',
      evidence_provenance: {
        record_type: 'infrastructure_resources',
        record_id: 'RES-403',
        field_name: 'status',
        observed_value: 'unconfirmed',
        required_value: 'ready',
        citation: "Resource Elasticsearch Enterprise License (RES-403) is 'unconfirmed'"
      },
      affected_requirement_id: 'REQ-202',
      potential_impact: 'Product catalog search queries blocked on staging cluster.',
      suggested_mitigation: 'Renew enterprise license with vendor prior to sprint kickoff.',
      owner_role: 'DevOps Lead',
      confidence_level: 'high'
    },
    {
      risk_id: 'RUN-501-RSK-905',
      risk_rule_id: 'RSK-905',
      dimension: 'compliance',
      title: 'PCI-DSS Level 1 Audit & Staging Environment Gap',
      description: 'Project stores and processes card payments, but AWS staging cluster RES-402 is not PCI certified, and internal team holds no active PCI audit credentials.',
      severity: 'critical',
      likelihood: 'high',
      evidence_provenance: {
        record_type: 'infrastructure_resources',
        record_id: 'RES-402',
        field_name: 'pci_certified',
        observed_value: false,
        required_value: true,
        citation: 'AWS Staging Cluster RES-402 has pci_certified=False'
      },
      affected_requirement_id: 'REQ-207',
      potential_impact: 'Regulatory non-compliance, merchant account suspension, and payment processor penalties.',
      suggested_mitigation: 'Tokenize all card data via Stripe Elements to keep core application out of PCI Level 1 scope.',
      owner_role: 'Security Officer',
      confidence_level: 'high'
    },
    {
      risk_id: 'RUN-501-RSK-906',
      risk_rule_id: 'RSK-906',
      dimension: 'historical',
      title: 'Historical Schedule Slip Recurrence (QuickMart Portal)',
      description: "Similar project QuickMart Portal (HPJ-801) experienced a +44.4% delivery slip: 'Third-party webhook reconciliation failures'.",
      severity: 'medium',
      likelihood: 'high',
      evidence_provenance: {
        record_type: 'historical_projects',
        record_id: 'HPJ-801',
        field_name: 'schedule_variance_pct',
        observed_value: 44.4,
        required_value: 0.0,
        citation: 'Historical project HPJ-801 experienced +44.4% schedule slip due to webhook integration failures'
      },
      affected_requirement_id: 'REQ-201',
      potential_impact: 'Repetition of webhook reconciliation delays adding up to 20 calendar days.',
      suggested_mitigation: 'Build local mock webhook test harness before integrating live sandbox.',
      owner_role: 'QA Lead',
      confidence_level: 'high'
    }
  ],
  recommended_action: 'proceed_with_conditions',
  pre_approval_conditions: [
    'Contract an external specialist with Proficiency >= 4 in SKL-105',
    'Reallocate at least 15h/week of Lead Backend Engineer capacity from PRJ-090',
    'Confirm enterprise license procurement for Elasticsearch Enterprise License'
  ]
};
