# DevMatrix AI — Database Schema Specification

## 1. Schema Overview & Design Conventions

The DevMatrix AI persistence layer is implemented in **PostgreSQL 15+**. It is designed for strict referential integrity, auditable data provenance, and reproducible analysis runs.

### 1.1 Identifier Conventions
All primary entities use deterministic, human-readable prefixed identifiers across the API and persistence layers:
- `organizations`: `ORG-{number}` (e.g., `ORG-001`)
- `projects`: `PRJ-{number}` (e.g., `PRJ-101`)
- `project_requirements`: `REQ-{number}` (e.g., `REQ-201`)
- `requirement_clarifications`: `CLR-{number}` (e.g., `CLR-301`)
- `documents`: `DOC-{number}` (e.g., `DOC-101`)
- `skills`: `SKL-{number}` (e.g., `SKL-101`)
- `employees`: `EMP-{number}` (e.g., `EMP-001`)
- `employee_certifications`: `CRT-{number}` (e.g., `CRT-001`)
- `employee_availability`: `AVL-{number}` (e.g., `AVL-001`)
- `employee_assignments`: `ASN-{number}` (e.g., `ASN-001`)
- `infrastructure_resources`: `RES-{number}` (e.g., `RES-401`)
- `historical_projects`: `HPJ-{number}` (e.g., `HPJ-801`)
- `feasibility_analysis_runs`: `RUN-{number}` (e.g., `RUN-501`)
- `identified_risks`: `RSK-{number}` (e.g., `RSK-901`)
- `feasibility_reports`: `REP-{number}` (e.g., `REP-701`)
- `manager_approvals`: `APP-{number}` (e.g., `APP-601`)
- `tasks`: `TSK-{number}` (e.g., `TSK-401`)
- `task_blockers`: `BLK-{number}` (e.g., `BLK-301`)
- `delivery_alerts`: `ALT-{number}` (e.g., `ALT-201`)
- `employee_performance_snapshots`: `PRF-{number}` (e.g., `PRF-101`)
- `audit_logs`: `AUD-{number}` (e.g., `AUD-001`)

### 1.2 Common Column Types & Standard Enums
- **Timestamps**: All stored as `TIMESTAMPTZ` in UTC (`2026-10-22T10:00:00Z`).
- **Monetary Values**: Stored as `NUMERIC(12, 2)` with a required ISO 4217 currency code (e.g., `USD`, `INR`).
- **Synthetic Flag**: All tables include `is_synthetic BOOLEAN NOT NULL DEFAULT FALSE` to unmistakably distinguish demo/mock data from genuine organizational records.
- **Enums**:
  - `project_status`: `'draft'`, `'analyzed'`, `'approved'`, `'rejected'`, `'in_delivery'`, `'completed'`, `'cancelled'`
  - `feasibility_status`: `'feasible'`, `'feasible_with_conditions'`, `'not_feasible'`, `'insufficient_information'`
  - `requirement_type`: `'functional'`, `'non_functional'`, `'architecture'`, `'integration'`, `'compliance'`
  - `severity_level`: `'low'`, `'medium'`, `'high'`, `'critical'`
  - `task_status`: `'todo'`, `'in_progress'`, `'blocked'`, `'done'`
  - `approval_decision`: `'approved'`, `'rejected'`, `'renegotiation_requested'`
  - `alert_type`: `'critical_blocker'`, `'effort_overrun'`, `'schedule_delay'`, `'capacity_conflict'`

---

## 2. Entity Relationship Diagram (ERD)

```
                    +--------------------+
                    |   organizations    |
                    +---------+----------+
                              |
       +----------------------+----------------------+
       | 1:N                                         | 1:N
       v                                             v
+--------------+                             +---------------+
|   projects   |                             |   employees   |
+------+-------+                             +-------+-------+
       |                                             |
       | 1:N                                         | 1:N
       +-----------------------+                     +-----------------------+
       |                       |                     |                       |
       v                       v                     v                       v
+---------------+     +------------------+    +---------------+     +--------------------+
|  requirements |     |  analysis_runs   |    |employee_skills|     |employee_assignments|
+---------------+     +--------+---------+    +---------------+     +--------------------+
                               |
                               | 1:N
       +-----------------------+-----------------------+
       |                       |                       |
       v                       v                       v
+---------------+     +------------------+    +------------------+
|identified_risk|     |feasibility_report|    | manager_approvals|
+---------------+     +------------------+    +--------+---------+
                                                       | (Unlocked on Approval)
                                                       v
                                              +------------------+
                                              |      tasks       |
                                              +--------+---------+
                                                       | 1:N
                                              +--------+---------+
                                              |                  |
                                              v                  v
                                       +---------------+  +---------------+
                                       | task_blockers |  |delivery_alerts|
                                       +---------------+  +---------------+
```

---

## 3. Detailed Table Specifications & DDL

### 3.1 Organization & Master Data

#### `organizations`
Represents the tenant or host enterprise context.
```sql
CREATE TABLE organizations (
    org_id VARCHAR(32) PRIMARY KEY, -- e.g. 'ORG-001'
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### `skills`
Master registry of technical and functional competencies.
```sql
CREATE TABLE skills (
    skill_id VARCHAR(32) PRIMARY KEY, -- e.g. 'SKL-101'
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- 'backend', 'frontend', 'cloud', 'security', 'data', 'qa'
    description TEXT,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### `employees`
Human talent directory within the organization.
```sql
CREATE TABLE employees (
    employee_id VARCHAR(32) PRIMARY KEY, -- e.g. 'EMP-001'
    org_id VARCHAR(32) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL, -- e.g. 'Lead Backend Engineer'
    email VARCHAR(255) NOT NULL UNIQUE,
    hourly_cost NUMERIC(10, 2) NOT NULL,
    weekly_capacity_hours NUMERIC(5, 2) NOT NULL DEFAULT 40.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_employees_org ON employees(org_id);
```

#### `employee_skills`
Evaluated proficiency and verified track record per skill.
```sql
CREATE TABLE employee_skills (
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    skill_id VARCHAR(32) NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency_level INT NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5), -- 1=Novice, 5=Expert
    years_experience NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    verified_projects_count INT NOT NULL DEFAULT 0,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (employee_id, skill_id)
);
CREATE INDEX idx_emp_skills_skill ON employee_skills(skill_id);
```

#### `employee_certifications`
Verified security, cloud, and architecture credentials.
```sql
CREATE TABLE employee_certifications (
    cert_id VARCHAR(32) PRIMARY KEY, -- e.g. 'CRT-001'
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    certification_name VARCHAR(255) NOT NULL,
    issuing_body VARCHAR(100) NOT NULL,
    credential_id VARCHAR(100),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_emp_certs_emp ON employee_certifications(employee_id);
```

#### `employee_availability`
Time-phased available bandwidth.
*Calculation: Units are person-hours per week (`hrs/week`) over the active delivery window $[t_{\text{start}}, t_{\text{end}}]$. `remaining_hours` = `total_capacity_hours` (40.0) - SUM(`assigned_hours_per_week` of overlapping assignments).*
```sql
CREATE TABLE employee_availability (
    availability_id VARCHAR(32) PRIMARY KEY, -- e.g. 'AVL-001'
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_capacity_hours NUMERIC(6, 2) NOT NULL, -- Gross contracted hours/week (typically 40.0)
    allocated_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.0, -- Sum of active assignments overlapping this period
    remaining_hours NUMERIC(6, 2) GENERATED ALWAYS AS (total_capacity_hours - allocated_hours) STORED,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_availability_dates CHECK (period_end >= period_start)
);
CREATE INDEX idx_emp_avail_emp_period ON employee_availability(employee_id, period_start, period_end);
```

#### `employee_assignments`
Existing project commitments drawing down availability.
```sql
CREATE TABLE employee_assignments (
    assignment_id VARCHAR(32) PRIMARY KEY, -- e.g. 'ASN-001'
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    project_id VARCHAR(32) NOT NULL, -- references projects or external project identifier
    project_name VARCHAR(255) NOT NULL,
    assigned_hours_per_week NUMERIC(5, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_emp_assign_emp ON employee_assignments(employee_id);
```

#### `infrastructure_resources`
Cloud accounts, licensed tools, and compliance environments.
```sql
CREATE TABLE infrastructure_resources (
    resource_id VARCHAR(32) PRIMARY KEY, -- e.g. 'RES-401'
    org_id VARCHAR(32) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'cloud_environment', 'tool_license', 'security_environment', 'third_party_saas'
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"cloud": "AWS", "tier": "t3.xlarge", "pci_certified": false}
    status VARCHAR(50) NOT NULL, -- 'ready', 'expired', 'under_provisioning', 'unconfirmed'
    monthly_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_infra_resources_org ON infrastructure_resources(org_id);
```

#### `historical_projects`
Past projects used by the risk engine to calibrate delay and overrun probabilities.
```sql
CREATE TABLE historical_projects (
    historical_id VARCHAR(32) PRIMARY KEY, -- e.g. 'HPJ-801'
    org_id VARCHAR(32) NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    project_code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    domain VARCHAR(100) NOT NULL, -- e.g. 'e-commerce', 'fintech', 'healthcare'
    tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['PostgreSQL', 'Stripe', 'FastAPI']
    planned_effort_hours NUMERIC(8, 2) NOT NULL,
    actual_effort_hours NUMERIC(8, 2) NOT NULL,
    planned_duration_days INT NOT NULL,
    actual_duration_days INT NOT NULL,
    planned_budget NUMERIC(12, 2) NOT NULL,
    actual_cost NUMERIC(12, 2) NOT NULL,
    schedule_variance_pct NUMERIC(6, 2) GENERATED ALWAYS AS (
        ((actual_duration_days::NUMERIC - planned_duration_days::NUMERIC) / NULLIF(planned_duration_days, 0)::NUMERIC) * 100.0
    ) STORED,
    documented_failure_causes TEXT,
    post_mortem_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_hist_projects_domain ON historical_projects(domain);
```

---

### 3.2 Projects, Intake & Requirements

#### `projects`
```sql
CREATE TABLE projects (
    project_id VARCHAR(32) PRIMARY KEY, -- e.g. 'PRJ-101'
    org_id VARCHAR(32) NOT NULL REFERENCES organizations(org_id) ON DELETE RESTRICT, -- Tenant ID: supplied in intake body or header, defaults to 'ORG-001' in demo mode
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    business_objectives TEXT NOT NULL,
    target_architecture TEXT,
    target_completion_date DATE NOT NULL,
    budget_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    team_size_limit INT,
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- 'draft', 'analyzed', 'approved', 'rejected', 'in_delivery'
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_projects_org_status ON projects(org_id, status);
```

#### `documents`
Uploaded requirement documents, RFPs, or notes.
```sql
CREATE TABLE documents (
    document_id VARCHAR(32) PRIMARY KEY, -- e.g. 'DOC-101'
    project_id VARCHAR(32) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'text/plain', 'application/pdf', 'text/markdown'
    file_size_bytes INT NOT NULL,
    raw_content TEXT NOT NULL,
    extracted_json JSONB,
    parsing_status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'parsed', 'failed'
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_documents_project ON documents(project_id);
```

#### `project_requirements`
Structured requirement entities.
```sql
CREATE TABLE project_requirements (
    requirement_id VARCHAR(32) PRIMARY KEY, -- e.g. 'REQ-201'
    project_id VARCHAR(32) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    source_document_id VARCHAR(32) REFERENCES documents(document_id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL, -- 'functional', 'non_functional', 'architecture', 'integration', 'compliance'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    acceptance_criteria TEXT,
    complexity_level VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    required_skill_id VARCHAR(32) REFERENCES skills(skill_id) ON DELETE SET NULL,
    minimum_skill_proficiency INT CHECK (minimum_skill_proficiency BETWEEN 1 AND 5),
    is_ambiguous BOOLEAN NOT NULL DEFAULT FALSE,
    has_unconfirmed_assumptions BOOLEAN NOT NULL DEFAULT FALSE,
    provenance VARCHAR(50) NOT NULL DEFAULT 'manual_entry', -- 'manual_entry', 'llm_extracted', 'file_import'
    verified_by_user BOOLEAN NOT NULL DEFAULT TRUE,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_requirements_project ON project_requirements(project_id);
CREATE INDEX idx_requirements_skill ON project_requirements(required_skill_id);
```

#### `requirement_clarifications`
Clarification questions generated during analysis.
```sql
CREATE TABLE requirement_clarifications (
    clarification_id VARCHAR(32) PRIMARY KEY, -- e.g. 'CLR-301'
    project_id VARCHAR(32) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    requirement_id VARCHAR(32) REFERENCES project_requirements(requirement_id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    impact_description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    answer TEXT,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_clarifications_proj ON requirement_clarifications(project_id, is_resolved);
```

---

### 3.3 Analysis, Risk Engine & Feasibility Reports

#### `feasibility_analysis_runs`
An immutable record of a specific analysis execution.
```sql
CREATE TABLE feasibility_analysis_runs (
    run_id VARCHAR(32) PRIMARY KEY, -- e.g. 'RUN-501'
    project_id VARCHAR(32) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    ruleset_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    overall_status VARCHAR(30) NOT NULL, -- 'feasible', 'feasible_with_conditions', 'not_feasible', 'insufficient_information'
    overall_score NUMERIC(5, 2) NOT NULL, -- 0.00 to 100.00 (Lower risk = higher feasibility)
    completeness_score NUMERIC(5, 2) NOT NULL,
    technical_complexity_score NUMERIC(5, 2) NOT NULL,
    org_capability_score NUMERIC(5, 2) NOT NULL,
    estimated_effort_hours_optimistic NUMERIC(8, 2) NOT NULL,
    estimated_effort_hours_nominal NUMERIC(8, 2) NOT NULL,
    estimated_effort_hours_pessimistic NUMERIC(8, 2) NOT NULL,
    estimated_cost_nominal NUMERIC(12, 2) NOT NULL,
    estimated_duration_days_nominal INT NOT NULL,
    summary_text TEXT NOT NULL,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analysis_runs_project ON feasibility_analysis_runs(project_id, created_at DESC);
```

#### `identified_risks`
Individual risk findings backed by verifiable organizational evidence.
```sql
CREATE TABLE identified_risks (
    risk_id VARCHAR(32) PRIMARY KEY, -- e.g. 'RSK-901'
    run_id VARCHAR(32) NOT NULL REFERENCES feasibility_analysis_runs(run_id) ON DELETE CASCADE,
    dimension VARCHAR(50) NOT NULL, -- e.g. 'skill_availability', 'employee_capacity', 'historical_patterns'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    likelihood VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
    evidence_provenance JSONB NOT NULL, -- Standard schema: {"record_type": "employee_availability", "record_id": "EMP-001", "field_name": "remaining_hours", "observed_value": 10.0, "required_value": 28.2, "citation": "..."}
    affected_requirement_id VARCHAR(32) REFERENCES project_requirements(requirement_id) ON DELETE SET NULL,
    potential_impact TEXT NOT NULL,
    suggested_mitigation TEXT NOT NULL,
    owner_role VARCHAR(100) NOT NULL,
    confidence_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_risks_run ON identified_risks(run_id, severity);
```

#### `feasibility_reports`
The final, decision-ready document payload.
```sql
CREATE TABLE feasibility_reports (
    report_id VARCHAR(32) PRIMARY KEY, -- e.g. 'REP-701'
    run_id VARCHAR(32) NOT NULL REFERENCES feasibility_analysis_runs(run_id) ON DELETE CASCADE,
    project_id VARCHAR(32) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    executive_summary TEXT NOT NULL,
    full_report_payload JSONB NOT NULL, -- Comprehensive nested JSON containing all 18 standard report sections
    recommended_action VARCHAR(50) NOT NULL, -- 'proceed', 'proceed_with_conditions', 'renegotiate', 'gather_more_info'
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reports_project ON feasibility_reports(project_id);
```

#### `manager_approvals`
The audit gate governing progression to task allocation.
*Integrity Validation: `run_id` and `report_id` must match the latest completed analysis run for `project_id`. The project must be in `'analyzed'` status. The backend rejects stale or mismatched approvals with HTTP 409 Conflict (`STALE_ANALYSIS_ERROR`).*
```sql
CREATE TABLE manager_approvals (
    approval_id VARCHAR(32) PRIMARY KEY, -- e.g. 'APP-601'
    project_id VARCHAR(32) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    run_id VARCHAR(32) NOT NULL REFERENCES feasibility_analysis_runs(run_id) ON DELETE RESTRICT,
    report_id VARCHAR(32) NOT NULL REFERENCES feasibility_reports(report_id) ON DELETE RESTRICT,
    decision VARCHAR(30) NOT NULL, -- 'approved', 'rejected', 'renegotiation_requested'
    manager_name VARCHAR(255) NOT NULL,
    manager_email VARCHAR(255) NOT NULL,
    decision_notes TEXT NOT NULL,
    approved_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    decision_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_approvals_project ON manager_approvals(project_id);
```

---

### 3.4 Workforce Optimization, Tasks & Delivery Telemetry

#### `tasks`
Work breakdown structure entities created after approval.
```sql
CREATE TABLE tasks (
    task_id VARCHAR(32) PRIMARY KEY, -- e.g. 'TSK-401'
    project_id VARCHAR(32) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    requirement_id VARCHAR(32) REFERENCES project_requirements(requirement_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    required_skill_id VARCHAR(32) NOT NULL REFERENCES skills(skill_id),
    minimum_proficiency INT NOT NULL CHECK (minimum_proficiency BETWEEN 1 AND 5),
    estimated_hours_optimistic NUMERIC(6, 2) NOT NULL, -- Service layer defaults to 0.8 * nominal if omitted in TaskCreate
    estimated_hours_nominal NUMERIC(6, 2) NOT NULL,
    estimated_hours_pessimistic NUMERIC(6, 2) NOT NULL, -- Service layer defaults to 1.4 * nominal if omitted in TaskCreate
    actual_hours_logged NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    assigned_employee_id VARCHAR(32) REFERENCES employees(employee_id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'blocked', 'done'
    dependency_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ['TSK-401']
    planned_start_date DATE,
    planned_end_date DATE,
    actual_completion_date DATE,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assigned_emp ON tasks(assigned_employee_id);
```

#### `task_blockers`
Blockers logged during execution.
```sql
CREATE TABLE task_blockers (
    blocker_id VARCHAR(32) PRIMARY KEY, -- e.g. 'BLK-301'
    task_id VARCHAR(32) NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    blocker_category VARCHAR(50) NOT NULL, -- 'third_party_api', 'infrastructure', 'missing_spec', 'dependency'
    severity VARCHAR(20) NOT NULL DEFAULT 'high', -- 'medium', 'high', 'critical'
    logged_by_employee_id VARCHAR(32) REFERENCES employees(employee_id) ON DELETE SET NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_blockers_task ON task_blockers(task_id, is_resolved);
```

#### `delivery_alerts`
Active system warnings triggered by the telemetry engine.
```sql
CREATE TABLE delivery_alerts (
    alert_id VARCHAR(32) PRIMARY KEY, -- e.g. 'ALT-201'
    project_id VARCHAR(32) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    task_id VARCHAR(32) REFERENCES tasks(task_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'critical_blocker', 'effort_overrun', 'schedule_delay', 'capacity_conflict'
    severity VARCHAR(20) NOT NULL, -- 'medium', 'high', 'critical'
    headline VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by VARCHAR(255),
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_alerts_project_ack ON delivery_alerts(project_id, is_acknowledged);
```

#### `employee_performance_snapshots`
Objective performance records calculated from delivery telemetry.
```sql
CREATE TABLE employee_performance_snapshots (
    snapshot_id VARCHAR(32) PRIMARY KEY, -- e.g. 'PRF-101'
    employee_id VARCHAR(32) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    project_id VARCHAR(32) NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    completed_tasks_count INT NOT NULL DEFAULT 0,
    estimate_accuracy_ratio NUMERIC(5, 2) NOT NULL, -- actual_hours / nominal_estimated_hours
    on_time_completion_ratio NUMERIC(5, 2) NOT NULL, -- on_time_tasks / total_tasks
    unresolved_blocker_days NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    external_blockers_discount_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    confidence_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high' (based on sample size)
    qualitative_context TEXT NOT NULL,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_perf_emp_project ON employee_performance_snapshots(employee_id, project_id);
```

#### `audit_logs`
Immutable audit trail for all governance events.
```sql
CREATE TABLE audit_logs (
    log_id VARCHAR(32) PRIMARY KEY, -- e.g. 'AUD-001'
    entity_name VARCHAR(50) NOT NULL, -- 'projects', 'manager_approvals', 'tasks'
    entity_id VARCHAR(32) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
    actor_id VARCHAR(255) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_name, entity_id);
```
