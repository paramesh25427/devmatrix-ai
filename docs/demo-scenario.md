# DevMatrix AI — Synthetic Demo Scenario & Seed Data Specification

> [!NOTE]
> All corporate entities, employee names, historical metrics, and infrastructure configurations defined in this document are **strictly synthetic demo fixtures** created specifically for the 48-hour hackathon demonstration.

---

## 1. Demo Narrative & Business Context

**Host Company**: *ShopNova Retail Corp* (`ORG-001`), a mid-market omnichannel retail brand attempting to launch a proprietary, multi-vendor marketplace platform: the **ShopNova E-Commerce Suite** (`PRJ-101`).

### The Challenge
ShopNova's management wants to replace their legacy monolith with an e-commerce platform supporting:
1. User registration, social login & session management
2. Product catalog with multi-facet search & filtering
3. Persistent cart & promotional checkout engine
4. High-security payment gateway integration (Stripe, Cards, UPI, Netbanking)
5. Live order state machine & tracking
6. Multi-vendor seller onboarding & inventory management
7. Admin dashboard for pricing & commission reconciliation
8. SMS/Email notification microservice
9. Security, PCI-DSS compliance & audit logging
10. Containerized deployment with automated backups

### Target Constraints
- **Target Budget**: $85,000.00 USD
- **Target Completion Date**: 60 Calendar Days from kickoff
- **Target Architecture**: Microservices (FastAPI + PostgreSQL + Redis + React)

---

## 2. Seeded Database Records (Exact IDs & Relationships)

### 2.1 Organization & Infrastructure Records

#### `organizations`
| org_id | name | domain | default_currency | is_synthetic |
| :--- | :--- | :--- | :--- | :--- |
| `ORG-001` | ShopNova Retail Corp | shopnova.internal | USD | `TRUE` |

#### `skills`
| skill_id | name | category | description |
| :--- | :--- | :--- | :--- |
| `SKL-101` | Python & FastAPI Microservices | backend | Async API design, Pydantic, dependency injection |
| `SKL-102` | React, TypeScript & Vite | frontend | Modern SPA development, Tailwind, React Query |
| `SKL-103` | PostgreSQL Schema & Query Optimization | data | Relational modeling, indexing, ACID transactions |
| `SKL-104` | AWS Cloud & Terraform | cloud | VPC, ECS Fargate, RDS, IAM security policies |
| `SKL-105` | Payment Gateway & PCI-DSS Integration | backend | 3D-Secure 2.0, Stripe webhooks, tokenization, card vaulting |
| `SKL-106` | Distributed Search & Elasticsearch | data | Inverted indices, fuzzy product search, cluster tuning |
| `SKL-107` | Quality Assurance & End-to-End Testing | qa | Playwright, Pytest, automated integration suites |

#### `infrastructure_resources`
| resource_id | org_id | name | category | status | specifications | monthly_cost |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RES-401` | `ORG-001` | AWS Production Multi-AZ VPC | cloud_environment | `ready` | `{"provider": "AWS", "tier": "Enterprise VPC", "regions": ["us-east-1"]}` | $1,200.00 |
| `RES-402` | `ORG-001` | AWS Staging Cluster | cloud_environment | `ready` | `{"provider": "AWS", "tier": "t3.medium", "pci_certified": false}` | $450.00 |
| `RES-403` | `ORG-001` | Elasticsearch Enterprise License | tool_license | `unconfirmed` | `{"vendor": "Elastic", "plan": "Platinum", "seats": 5}` | $800.00 |
| `RES-404` | `ORG-001` | Stripe Verified Sandbox Org | third_party_saas | `ready` | `{"plan": "Custom", "webhook_endpoints": 2}` | $0.00 |

---

### 2.2 Employee Directory, Skills & Workload

#### `employees`
*Note: `remaining_hours` is dynamically computed in units of person-hours per week (`hrs/week`) over the project's 8.5-week delivery window: `weekly_capacity` (40.0) minus active project commitments in `employee_assignments`.*

| employee_id | name | role | email | hourly_cost | weekly_capacity | remaining_hours |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `EMP-001` | Arjun Mehta | Lead Backend Engineer | arjun.mehta@shopnova.internal | $75.00 | 40.0 | **10.0** |
| `EMP-002` | Priya Sharma | Senior Frontend Engineer | priya.sharma@shopnova.internal | $70.00 | 40.0 | **30.0** |
| `EMP-003` | Rohan Das | Fullstack Developer | rohan.das@shopnova.internal | $55.00 | 40.0 | **35.0** |
| `EMP-004` | Sneha Patel | DevOps & Cloud Architect | sneha.patel@shopnova.internal | $80.00 | 40.0 | **20.0** |
| `EMP-005` | David Kim | QA Automation Lead | david.kim@shopnova.internal | $60.00 | 40.0 | **25.0** |
| `EMP-006` | Sarah Jenkins | Engineering Manager | sarah.jenkins@shopnova.internal | $95.00 | 40.0 | **15.0** |

#### `employee_skills`
| employee_id | skill_id | proficiency_level (1-5) | years_experience | verified_projects_count |
| :--- | :--- | :--- | :--- | :--- |
| `EMP-001` | `SKL-101` (FastAPI) | **5** | 6.5 | 8 |
| `EMP-001` | `SKL-103` (Postgres) | **5** | 7.0 | 9 |
| `EMP-001` | `SKL-105` (Payment & PCI) | **2** *(Deficit!)* | 1.0 | 1 |
| `EMP-002` | `SKL-102` (React) | **5** | 5.5 | 7 |
| `EMP-003` | `SKL-101` (FastAPI) | **3** | 2.5 | 3 |
| `EMP-003` | `SKL-102` (React) | **3** | 2.0 | 2 |
| `EMP-004` | `SKL-104` (AWS) | **5** | 6.0 | 8 |
| `EMP-005` | `SKL-107` (QA) | **5** | 5.0 | 6 |

#### `employee_assignments` (Active Project Commitments)
| assignment_id | employee_id | project_id | project_name | assigned_hours_per_week | dates |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ASN-001` | `EMP-001` | `PRJ-090` | Warehouse Inventory ERP V2 | **30.0 hrs/week** | 2026-10-01 to 2026-12-31 |
| `ASN-002` | `EMP-002` | `PRJ-095` | Marketing Landing Page | **10.0 hrs/week** | 2026-10-15 to 2026-11-15 |
| `ASN-003` | `EMP-004` | `PRJ-090` | Cloud Migration Ops | **20.0 hrs/week** | 2026-10-01 to 2026-11-30 |

---

### 2.3 Historical Project Outcomes (Empirical Baseline)

#### `historical_projects`
| historical_id | project_code | title | tech_stack | planned_days | actual_days | variance | failure_causes & notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HPJ-801` | `QMRT` | QuickMart Portal | `["FastAPI", "Stripe", "PostgreSQL"]` | 45 | 65 | **+44.4%** | *Third-party webhook reconciliation & bank 3D-Secure sandbox instability caused 20-day delivery slip.* |
| `HPJ-802` | `LOGI` | LogiTrack Fleet App | `["React", "Node.js", "PostgreSQL"]` | 60 | 62 | **+3.3%** | *Delivered on schedule; minor UI layout bug fixes during acceptance testing.* |
| `HPJ-803` | `RHUB` | RetailHub Flash Sale | `["FastAPI", "Redis", "Elasticsearch"]` | 30 | 50 | **+66.7%** | *Unspecified peak concurrency requirements led to Black Friday database connection pool exhaustion.* |

---

### 2.4 Ingested Requirements for ShopNova E-Commerce Suite (`PRJ-101`)

| requirement_id | type | title | complexity | required_skill | min_prof | ambiguity_flag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `REQ-201` | functional | Payment Gateway & 3D-Secure 2.0 Integration | `critical` | `SKL-105` | 4 | `FALSE` |
| `REQ-202` | functional | Multi-Facet Product Catalog & Fuzzy Search | `high` | `SKL-106` | 4 | `FALSE` |
| `REQ-203` | functional | Persistent Shopping Cart & Coupon Engine | `high` | `SKL-101` | 3 | `FALSE` |
| `REQ-204` | functional | Order Processing State Machine & Dispatch | `critical` | `SKL-101` | 4 | `FALSE` |
| `REQ-205` | functional | Responsive Customer Checkout & Account UI | `medium` | `SKL-102` | 3 | `FALSE` |
| `REQ-206` | non_functional | Concurrency & Peak Traffic Scaling | `high` | `SKL-104` | 4 | **`TRUE`** *(Missing RPS!)* |
| `REQ-207` | compliance | PCI-DSS Level 1 Customer Card Protection | `critical` | `SKL-105` | 4 | `FALSE` |
| `REQ-208` | compliance | Automated Daily Backup & Recovery (RPO < 1h) | `medium` | `SKL-104` | 3 | `FALSE` |

---

## 3. Five Evidence-Backed Findings (The "Aha!" Moments)

During the demo, DevMatrix AI will surface five specific findings. Every finding references exact database keys:

```
[Finding 1: Skill Deficit] 
  REQ-201 / REQ-207 requires SKL-105 (Proficiency >= 4)
  Citation: employee_skills shows EMP-001 has only Proficiency 2; no certified PCI staff.

[Finding 2: Capacity Bottleneck]
  Backend tasks require 28.2 hrs/week (240 nominal backend hours over 8.5 weeks).
  Citation: employee_availability shows EMP-001 has only 10.0 hrs/week free (ASN-001 on PRJ-090).

[Finding 3: Missing Critical Spec]
  REQ-206 has ambiguity_flag=true.
  Citation: Missing peak RPS parameter; generated Clarification Question CLR-301.

[Finding 4: Historical Delay Recurrence]
  Similar project HPJ-801 with Stripe integration experienced +44.4% schedule slip.
  Citation: HPJ-801 post_mortem notes: "Third-party webhook reconciliation failures".

[Finding 5: Infrastructure Prerequisite Unconfirmed]
  REQ-202 requires Elasticsearch cluster.
  Citation: infrastructure_resources RES-403 status is 'unconfirmed' (license expired).
```

---

## 4. Step-by-Step Hackathon Demonstration Script

### Step 1: Project Intake & Requirements Review (Time: 0:00 - 1:00)
- **Actor**: Project Manager (Sarah Jenkins)
- **UI Screen**: `/projects/new`
- **Action**: Enters Project Title: *"ShopNova E-Commerce Suite"*, Budget: *"$85,000.00"*, Target Date: *"60 Days"*.
- **Upload**: Uploads `shopnova_spec.md`. System populates `REQ-201` through `REQ-208`.
- **System Call**: `POST /api/v1/projects` $\rightarrow$ returns `{"project_id": "PRJ-101", "org_id": "ORG-001", "status": "draft"}`.

### Step 2: Running Feasibility & Risk Analysis (Time: 1:00 - 2:00)
- **UI Screen**: `/projects/PRJ-101/feasibility`
- **Action**: Clicks **"Run Organization-Aware Feasibility Analysis"**.
- **System Call**: `POST /api/v1/projects/PRJ-101/analyze`.
- **UI Presentation**:
  - Overall Feasibility Badge: **`FEASIBLE WITH CONDITIONS`** (Score: `59.6 / 100` risk; `59.58` exact).
  - Executive Summary: Highlights ample budget ($85k vs $44.7k estimated), but flags severe backend workload (28.2h vs 10h remaining) and PCI skill deficits.
  - Interactive Risk Register: Sorts by `CRITICAL` and `HIGH`.

### Step 3: Inspecting Underlying Evidence Chains (Time: 2:00 - 3:00)
- **UI Screen**: Click into Risk `RSK-901` (*"Backend Lead Bandwidth Deficit"*).
- **Inspector Drawer**: Displays evidence provenance card:
  - *"Employee Arjun Mehta (`EMP-001`) committed 30h/week to `PRJ-090` (Assignment `ASN-001`). Available: 10h/week. Required: 28.2h/week."*
- **Click into Risk `RSK-902`** (*"PCI-DSS Certification Gap"*):
  - Shows that no employee has `SKL-105` $\ge 4$, citing `HPJ-801` where payment integration slipped 20 days.
- **Clarification Tab**: Displays `CLR-301`: *"What is the peak transactions/sec during sale days?"*

### Step 4: Scenario Analysis & Mitigation Simulator (Time: 3:00 - 3:30)
- **UI Screen**: Feasibility Report $\rightarrow$ *"What-If Scenario Sandbox"*.
- **Action**: Manager toggles:
  1. *Option A: "Hire Contract PCI Specialist ($12,000 cost)"* $\rightarrow$ Drops S3 skill risk by 7.50 and S9 compliance risk by 3.75.
  2. *Option B: "Reallocate 15h of Arjun Mehta from PRJ-090"* $\rightarrow$ Drops S4 capacity deficit by 15.00.
  3. *Option C: "Confirm Elasticsearch License"* $\rightarrow$ Drops S7 infrastructure risk by 2.50.
  - **Result**: Risk score deterministically drops from **59.6** to **30.8** (status becomes `feasible` in what-if simulation).

### Step 5: Manager Approval Gate (Time: 3:30 - 4:00)
- **UI Screen**: `/projects/PRJ-101/approval`
- **Action**: Sarah Jenkins signs approval modal:
  - Decision: `APPROVED`
  - Targets: `run_id: "RUN-501"`, `report_id: "REP-701"`
  - Condition: *"Approve with condition: Onboard external PCI contractor and reallocate 15h from PRJ-090."*
- **System Call**: `POST /api/v1/projects/PRJ-101/approve` with payload `{"run_id": "RUN-501", "report_id": "REP-701", "decision": "approved", ...}`.
- **System Transition**: Project status transitions from `analyzed` $\rightarrow$ `approved`. Task generation unlocked!

### Step 6: Team Allocation & Task Breakdown (Time: 4:00 - 5:00)
- **UI Screen**: `/projects/PRJ-101/workforce`
- **System Call**: `GET /api/v1/projects/PRJ-101/workforce/recommendations`.
- **UI Presentation**:
  - Recommends: Priya Sharma (`EMP-002`, 30h/week), Rohan Das (`EMP-003`, 35h/week), Arjun Mehta (`EMP-001`, adjusted 25h/week), Sneha Patel (`EMP-004`, 20h/week), David Kim (`EMP-005`, 25h/week).
- **Action**: Clicks **"Generate Task WBS"** (`POST /api/v1/projects/PRJ-101/tasks/generate`).
- **Result**: Displays interactive Gantt / Task DAG with `TSK-401` through `TSK-410`.

### Step 7: Delivery Telemetry & Blocker Simulation (Time: 5:00 - 6:00)
- **UI Screen**: `/projects/PRJ-101/delivery`
- **Action**: Developer logs progress on `TSK-401` (*"Stripe Webhook API"*):
  - Status changed to `BLOCKED`.
  - Injects blocker: *"Stripe sandbox webhook signing secret is invalid (`BLK-301`)."*
- **System Call**: `POST /api/v1/tasks/TSK-401/blockers`.
- **Real-Time Alert**: System dispatches `ALT-201` (*"Critical Blocker on Critical-Path Task TSK-401"*).
- **Forecast Impact**: Delivery completion date dynamically shifts by +3 calendar days.

### Step 8: Contextual Performance Intelligence & Review (Time: 6:00 - 7:00)
- **UI Screen**: `/projects/PRJ-101/performance`
- **Presentation**: Shows employee contribution telemetry:
  - Arjun Mehta: Estimate accuracy `1.08` (High precision).
  - Telemetry notes: *"Delay on TSK-401 discounted due to documented external dependency failure (BLK-301)."*
  - Concludes with clear historical comparison against `HPJ-801`.
