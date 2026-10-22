# DevMatrix AI — System Architecture & Implementation Blueprint

## 1. Executive Summary & Architectural Vision

**DevMatrix AI** is an organization-aware, AI-assisted project feasibility, risk assessment, workforce optimization, and delivery monitoring platform built for a 48-hour hackathon. 

Traditional estimation tools evaluate software projects in a vacuum, focusing merely on requirement checklists, arbitrary deadline calendars, and generic risk templates. DevMatrix AI shifts this paradigm: it evaluates proposed project requirements against the **empirical reality of the host organization**—its employee proficiencies, actual remaining capacity, infrastructure constraints, third-party vendor readiness, and historical delivery patterns.

```
       +-----------------------------------------------------------------+
       |                      CLIENT / PM INTAKE                         |
       |  (Document Upload / Form Input / Structured Project Metadata)   |
       +--------------------------------+--------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                       DEVMATRIX AI CORE PLATFORM                              |
|                                                                               |
|  +--------------------+   +-----------------------+   +--------------------+  |
|  | Requirements Engine|   | Organization Profiler |   | Risk Engine        |  |
|  | - Entity Extraction|   | - Skill Matrix        |   | - 11 Dimensions    |  |
|  | - Ambiguity Check  |   | - Live Capacity Map   |   | - Deterministic    |  |
|  | - Clarifications   |   | - Infrastructure State|   | - Evidence Backed  |  |
|  +---------+----------+   +-----------+-----------+   +---------+----------+  |
|            |                          |                         |             |
|            +--------------------------+-------------------------+             |
|                                       v                                       |
|                    +------------------------------------+                     |
|                    | Feasibility Report Generator (v1)  |                     |
|                    | - Status: Feasible w/ Conditions   |                     |
|                    | - Provenance & Audit Citations     |                     |
|                    +------------------+-----------------+                     |
|                                       |                                       |
|                                       v                                       |
|                    +------------------------------------+                     |
|                    | Human-in-the-Loop Approval Gate    |                     |
|                    +------------------+-----------------+                     |
|                                       | (Approved)                            |
|                                       v                                       |
|  +------------------------------------+------------------------------------+  |
|  |                   Workforce Optimizer & Execution Engine                |  |
|  |  - Skill-Fit & Capacity Matching   - Delivery & Blocker Monitoring      |  |
|  |  - Dependency-Aware Task Plan      - Contextual Performance Intelligence|  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

---

## 2. End-to-End Product Workflow (Stages A – I)

The platform is designed around 9 discrete, auditable stages:

```
[Stage A: Intake] ──> [Stage B: Analysis] ──> [Stage C: Org Profiling]
         │                                              │
         ▼                                              ▼
[Stage F: Approval Gate] <── [Stage E: Report] <── [Stage D: Risk Engine]
         │
         ▼ (Approved)
[Stage G: Team & Tasks] ──> [Stage H: Delivery Monitoring] ──> [Stage I: Performance/Learning]
```

### Stage A — Project Intake
- **Inputs**: Project name, business objectives, functional & non-functional requirements (NFRs), target architecture, external dependencies, budget, deadline, constraints.
- **Organization Context**: Explicitly resolved via (1) request body `org_id`, (2) `X-Organization-ID` HTTP header or JWT auth claim, or (3) fallback to `'ORG-001'` in synthetic demo mode.
- **Modalities**:
  1. Direct structured web form (primary reliable path).
  2. Document upload (PDF, Markdown, TXT) processed via structured extraction pipeline.
- **Fallback Guarantee**: If document extraction encounters formatting issues or LLM services are offline, the user can review and edit all parsed fields in the UI prior to submission.

### Stage B — Requirements Analysis
- Normalizes raw text into discrete, testable `ProjectRequirement` entities.
- Analyzes requirements for completeness, contradictions, ambiguous acceptance criteria, unstated assumptions, and high-complexity flags.
- Emits structured `RequirementClarification` questions with severity levels (e.g., Missing peak traffic RPS flagged as `HIGH` severity).
- Optional LLM integration provides extraction assistance; every extracted item is tagged with `provenance="llm_extracted"` and requires human verification (`verified=false` by default).

### Stage C — Organization Data Profiling
- Ingests and structures organization-specific operational context:
  - **Employees**: Skills (1–5 proficiency), verified experience, weekly capacity, hourly cost.
  - **Remaining Capacity**: Evaluated in **person-hours per week (`hrs/week`)** over the active calendar date window of the project: `weekly_capacity_hours` (40.0) minus active overlapping project assignments in `employee_assignments`.
  - **Infrastructure Resources**: Cloud environments, tools, enterprise licenses, security compliance certifications (e.g., PCI-DSS, SOC2).
  - **Historical Projects**: Empirical performance metrics (planned vs. actual hours, calendar delay variance, documented failure causes).
- **Rule of Integrity**: If data is absent, the system flags `MISSING_DATA`. No synthetic hallucination of org capabilities.

### Stage D — Feasibility & Risk Analysis
- Executes an explainable, deterministic 11-dimension evaluation:
  1. Technical Feasibility & Architecture Complexity
  2. Requirements Completeness & Ambiguity
  3. Skill Availability & Expertise Gaps
  4. Employee Capacity & Workload Conflicts
  5. Budget & Cost Viability
  6. Deadline & Schedule Feasibility
  7. Infrastructure, Tooling & License Readiness
  8. External Integration & Dependency Risk
  9. Security, Privacy & Compliance Readiness
  10. Historical Project Patterns & Delay Recurrence
  11. Operational, Monitoring & Deployment Readiness
- Emits a deterministic feasibility status: `feasible`, `feasible_with_conditions`, `not_feasible`, or `insufficient_information`.
- Outputs an exact composite risk score (e.g., **59.6 / 100** baseline, deterministically dropping to **30.8** in what-if simulation upon specialist onboarding and capacity reallocation).
- Every risk item references explicit record IDs (e.g., `EMP-001`, `HPJ-801`, `REQ-204`) proving *why* the risk exists.

### Stage E — Comprehensive Feasibility Report
- Compiles a reproducible, immutable `FeasibilityReport` object.
- Includes PERT three-point effort estimation (`estimated_effort_hours_optimistic`, `estimated_effort_hours_nominal`, `estimated_effort_hours_pessimistic`) presented as an indicative heuristic planning spread.
- Stored as a versioned JSON payload ensuring audits reproduce identical results.

### Stage F — Manager Decision & Approval Gate
- Project managers review the report, view underlying evidence chains, and choose one of:
  - `approved`: Locks requirements baseline, binds specific `run_id` and `report_id`, and unlocks Stage G.
  - `renegotiation_requested`: Sends targeted clarification queries to stakeholders.
  - `rejected`: Archives project with recorded justification.
- **Hard Guardrail & Integrity Check**: Automated team allocation and task generation are prohibited until an explicit `approved` record is signed by an authenticated manager. The backend validates that `run_id` matches the latest completed analysis run; stale or mismatched approvals are rejected with HTTP 409 Conflict.

### Stage G — Team Allocation & Task Planning
- **Team Recommendation**: Matches required task skills against employee proficiency and *remaining* capacity (not gross capacity).
- Multi-criteria recommendation rationale (Cost vs. Skill Depth vs. Availability).
- **Task Breakdown**: Converts structured requirements into a Directed Acyclic Graph (DAG) of tasks with explicit dependencies, required proficiencies, and PERT hours.
- Managers review, tweak, and commit the assignments.

### Stage H — Delivery Monitoring
- Tracks delivery telemetry: Task status (`todo`, `in_progress`, `blocked`, `done`), planned vs. actual hours, milestone burn-up.
- **Real-Time Delivery Alerts**: Automatically triggered when:
  - A critical-path task is blocked (`ALT-CRITICAL-BLOCKER`).
  - Actual hours exceed 115% of estimated ceiling (`ALT-EFFORT-OVERRUN`).
  - An assigned engineer's overall capacity is breached across projects (`ALT-CAPACITY-BREACH`).
- Dynamically recalculates project delivery forecast upon blocker injection.

### Stage I — Performance Intelligence & Historical Learning
- Generates post-iteration and post-project contribution summaries.
- Evaluates: Estimate accuracy ratio, blocker resolution speed, quality/rework incidents, collaboration handoffs.
- **Fairness & Context Guards**:
  - Automatically discounts delays caused by external blockers or documented dependency failures.
  - Surfaces confidence intervals based on sample size (e.g., "Evaluation based on 3 tasks (Low Confidence)").
  - No automated HR/employment decisions; human-in-the-loop review only.
- Feeds actual project performance back into `historical_projects` table to make future risk analysis smarter.

---

## 3. System Architecture & Component Diagram

DevMatrix AI follows a clean, decoupled architecture:

```
+-----------------------------------------------------------------------------------+
|                           PRESENTATION TIER (Vite + React)                        |
|                                                                                   |
|  [Intake / Upload Form]   [Requirements Reviewer]   [Feasibility Report Dashboard] |
|  [Approval Action Bar]    [Team / Task Planner]     [Delivery & Alert Monitor]     |
|                                                                                   |
|  Tech: TypeScript, Tailwind CSS, Lucide React, Recharts, React Query, Axios      |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (JSON)
                                           v
+-----------------------------------------------------------------------------------+
|                        APPLICATION API TIER (FastAPI / Python)                     |
|                                                                                   |
|  [/api/v1/projects]        [/api/v1/requirements]       [/api/v1/organization]    |
|  [/api/v1/analysis]        [/api/v1/reports]            [/api/v1/approvals]       |
|  [/api/v1/workforce]       [/api/v1/tasks]              [/api/v1/delivery]        |
|  [/api/v1/performance]     [/api/v1/audit]                                         |
|                                                                                   |
|  Features: Pydantic v2 DTOs, Strict Enums, Standard Error Envelope, CORS, Auth Stubs|
+------------------------------------------+----------------------------------------+
                                           |
         +---------------------------------+---------------------------------+
         |                                 |                                 |
         v                                 v                                 v
+--------------------+           +--------------------+           +--------------------+
| REQUIREMENTS CORE  |           | RISK & FEASIBILITY |           | WORKFORCE & TASKS  |
|                    |           | ENGINE             |           | OPTIMIZER          |
| - Text Preprocessor|           | - 11 Risk Analyzers|           | - Capacity Resolver|
| - Ambiguity Flagger|           | - PERT Estimator   |           | - Skill Ranker     |
| - LLM Extractor    |           | - Decision Matrix  |           | - DAG Scheduler    |
|   (Optional/Mock)  |           | - Provenance Tracer|           | - Alert Engine     |
+---------+----------+           +---------+----------+           +---------+----------+
          |                                |                                |
          +--------------------------------+--------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                           PERSISTENCE TIER (PostgreSQL 15+)                       |
|                                                                                   |
|  Tables: organizations, projects, project_requirements, requirement_clarifications|
|          documents, skills, employees, employee_skills, employee_availability,     |
|          employee_assignments, infrastructure_resources, historical_projects,     |
|          feasibility_analysis_runs, identified_risks, feasibility_reports,        |
|          manager_approvals, tasks, task_blockers, delivery_alerts, audit_logs     |
|                                                                                   |
|  Tech: SQLAlchemy 2.0 (Core + ORM), Alembic migrations, psycopg2-binary           |
+-----------------------------------------------------------------------------------+
```

---

## 4. Module Boundaries & Responsibilities

To enable 4 developers to build simultaneously without stepping on each other, code responsibilities are strictly encapsulated behind clean internal modules:

```
backend/
├── app/
│   ├── main.py                     # App entry point, CORS, router mounting
│   ├── core/                       # Shared configs, db session, security
│   │   ├── config.py
│   │   ├── database.py
│   │   └── exceptions.py
│   ├── schemas/                    # Pydantic v2 request/response DTOs (The Contract)
│   │   ├── common.py
│   │   ├── project.py
│   │   ├── requirement.py
│   │   ├── organization.py
│   │   ├── analysis.py
│   │   ├── approval.py
│   │   ├── workforce.py
│   │   ├── delivery.py
│   │   └── performance.py
│   ├── models/                     # SQLAlchemy 2.0 ORM DB Models
│   │   ├── project.py
│   │   ├── organization.py
│   │   ├── analysis.py
│   │   └── delivery.py
│   ├── services/                   # Business Logic Modules
│   │   ├── intake_service.py       # Stage A/B: Document parsing, requirement extraction
│   │   ├── risk_engine/            # Stage D: Deterministic 11-dimension scoring
│   │   │   ├── engine.py           # Orchestrator
│   │   │   ├── rules/              # Modular dimension calculators
│   │   │   └── pert_estimator.py   # Range & confidence modeling
│   │   ├── report_generator.py     # Stage E: Structured JSON report compilation
│   │   ├── approval_service.py     # Stage F: Decision gate enforcement
│   │   ├── workforce_service.py    # Stage G: Team allocation & DAG task breakdown
│   │   ├── delivery_service.py     # Stage H: Telemetry, status, alert triggers
│   │   └── performance_service.py  # Stage I: Historical & contribution analytics
│   └── api/                        # REST Controllers (Thin wrappers around services)
│       └── v1/
│           ├── endpoints_projects.py
│           ├── endpoints_analysis.py
│           ├── endpoints_approvals.py
│           ├── endpoints_workforce.py
│           └── endpoints_delivery.py
```

---

## 5. Four-Person Work Split & Interfaces

| Role | Developer | Core Domain & Deliverables | Primary Code Paths |
| :--- | :--- | :--- | :--- |
| **Dev 1** | Frontend Lead | • Complete React+Vite UI<br>• Project intake & Doc Upload UI<br>• Interactive Feasibility Report & Risk Register<br>• Manager Approval Modal<br>• Team Allocation & Delivery Gantt/Alert Dashboard | `frontend/src/pages/`<br>`frontend/src/components/`<br>`frontend/src/services/api.ts` |
| **Dev 2** | Risk & Feasibility Specialist | • Stage B Requirements extraction & ambiguity rules<br>• Stage D 11-dimension deterministic risk calculations<br>• PERT estimation formulas & confidence scoring<br>• Provenance citation builder (linking risks to DB records) | `backend/app/services/risk_engine/`<br>`backend/app/services/intake_service.py`<br>`backend/app/services/report_generator.py` |
| **Dev 3** | Backend & Database Architect | • FastAPI app scaffolding, DB connection & pooling<br>• PostgreSQL schema definitions & migrations<br>• Comprehensive Pydantic v2 DTOs (shared contract)<br>• REST CRUD endpoints for Projects, Org, Requirements<br>• Synthetic Demo Data Seed Script (`seed_demo_data.py`) | `backend/app/main.py`<br>`backend/app/models/`<br>`backend/app/schemas/`<br>`backend/app/api/`<br>`backend/scripts/seed_demo_data.py` |
| **Dev 4** | Workforce & Delivery Specialist | • Stage G Team recommendation algorithm (skill-fit + remaining capacity)<br>• Stage G Task DAG generator with dependencies<br>• Stage H Delivery monitoring & alert dispatch rules<br>• Stage I Performance evaluation metrics & historical comparison | `backend/app/services/workforce_service.py`<br>`backend/app/services/delivery_service.py`<br>`backend/app/services/performance_service.py`<br>`backend/app/api/endpoints_workforce.py` |

### Shared Contracts & Integration Checkpoints

```
[Hour 0-4]   ALIGNMENT: Commit docs/ contracts. Dev 3 establishes Pydantic schemas & DB.
[Hour 4-8]   MOCKING: Dev 3 provides FastAPI with mock JSON responses based on docs/api-contract.md.
             Dev 1 starts frontend against live mock API immediately.
[Hour 8-24]  CORE LOGIC:
             - Dev 2 writes deterministic risk engine tests against seeded mock org data.
             - Dev 4 writes workforce optimizer & delivery alert tests.
             - Dev 1 builds Intake, Report, and Dashboard views.
             - Dev 3 writes Postgres persistence & real CRUD endpoints.
[Hour 24-32] INTEGRATION CHECKPOINT 1 (Intake -> Risk Engine -> Report -> Approval):
             Validate that user input generates an authentic, evidence-backed report.
[Hour 32-40] INTEGRATION CHECKPOINT 2 (Approval -> Workforce -> Tasks -> Delivery Alerts):
             Validate approval gate, team recommendation, and task progress alert firing.
[Hour 40-48] POLISH & DEMO HARDENING:
             End-to-end rehearsal using the seeded ShopNova e-commerce scenario.
```

---

## 6. Minimal Deployment & Implementation Sequence

### Local Development Setup (Fast & Deterministic)
1. **Database**: PostgreSQL instance running locally on `localhost:5432` or via Docker Compose:
   ```bash
   docker run -d --name devmatrix-db -p 5432:5432 -e POSTGRES_DB=devmatrix -e POSTGRES_PASSWORD=postgres postgres:15-alpine
   ```
2. **Backend**: Python 3.11+ virtual environment:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install fastapi==0.111.0 uvicorn[standard]==0.30.1 pydantic==2.7.4 pydantic-settings==2.3.4 sqlalchemy==2.0.30 psycopg2-binary==2.9.9 python-multipart==0.0.9 python-dotenv==1.0.1 pytest==8.2.2 httpx==0.27.0
   uvicorn backend.app.main:app --reload --port 8000
   ```
3. **Frontend**: Node 18+ Vite dev server with Tailwind CSS pinned to v3:
   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install react react-dom axios @tanstack/react-query lucide-react recharts
   npm install -D tailwindcss@^3.4.17 postcss autoprefixer
   npx tailwindcss init -p
   npm run dev -- --port 5173
   ```
   > [!IMPORTANT]
   > **Tailwind CSS v3 Pinning**: Tailwind CSS is explicitly pinned to `^3.4.17` (`tailwindcss@^3.4.17 postcss autoprefixer`). An unpinned installation defaults to Tailwind CSS v4, which deprecates `tailwind.config.js` and breaks `npx tailwindcss init -p`. Locking to v3 avoids configuration thrash during the 48-hour hackathon.
4. **Proxy**: Vite configured in `vite.config.ts` to proxy `/api` requests directly to `http://127.0.0.1:8000`.

### Database Seeding Command
A single command populates the database with the exact synthetic company scenario:
```bash
python -m backend.scripts.seed_demo_data
```

---

## 7. MVP Scope vs. Deferred Features

| Feature Area | In-Scope for 48h MVP | Deferred (Post-Hackathon Roadmap) |
| :--- | :--- | :--- |
| **Project Intake** | • Multi-section web form with structured NFRs<br>• Text file / Markdown upload with deterministic regex/keyword parser<br>• Fallback manual review editor | • OCR for scanned PDFs<br>• Real-time Jira / Confluence bi-directional import |
| **Requirements Analysis** | • Rule-based ambiguity & missing information detection<br>• Clarification question generator<br>• Traceable field provenance | • Autonomous interactive chatbot for clients<br>• Semantic vector similarity deduplication |
| **Risk Engine** | • Deterministic 11-dimension scoring algorithms<br>• Explicit record ID provenance linking<br>• PERT three-point effort & cost range formulas<br>• Hard veto rules for fatal blockers | • Monte Carlo simulations (10,000 iterations)<br>• Multi-tenant custom weighted risk policy editor |
| **Workforce Optimizer** | • Deterministic heuristic matching (Skill proficiency + remaining capacity)<br>• DAG task generation with predecessor IDs<br>• Human manager override and manual reassignment | • Integer Linear Programming (ILP) solver for multi-project org-wide resource balancing<br>• Automatic calendar schedule optimization with PTO/holidays |
| **Delivery Monitoring** | • Task status updates (`todo`, `in_progress`, `blocked`, `done`)<br>• Actual vs. planned hour logging<br>• Automated alert triggers for critical blockers & overruns | • GitHub / GitLab webhook integration for commit-level telemetry<br>• Automatic PR size and code churn analysis |
| **Performance Intelligence**| • Task estimation accuracy & blocker resolution metrics<br>• Evidence-backed contribution summaries<br>• Historical project comparison view | • Peer 360-degree review integration<br>• Predictive turnover and burn-out detection |
