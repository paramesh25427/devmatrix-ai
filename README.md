# DevMatrix AI — Project Commander Edition
> **Viksitthon 2026** · AI-Assisted Software Project Feasibility, Team Allocation & Delivery Management Platform

DevMatrix AI converts raw, unstructured client software requirement documents into an auditable, deterministic project assessment. A delivery manager reviews the assessment, edits requirements with immediate real-time recalculation, approves a locked baseline, allocates an optimized engineering team, tracks delivery milestones with rule-based operational alerts, advances simulated timelines, and records completed project outcomes into a closed-loop historical learning engine.

---

## 1. Core Architecture Principles

1. **AI Interprets & Structures**: Google Gemini (`google-genai` SDK) extracts and structures requirements, gaps, conflicts, risks, required skills, and milestones into verified Pydantic JSON.
2. **Deterministic Python Rules**: All effort, duration, cost, and feasibility verdicts are calculated strictly in pure Python (`backend/rules_engine.py`). The AI NEVER decides the feasibility verdict or project cost.
3. **Capacity-Constrained Team Optimizer**: The greedy optimizer (`backend/team_optimizer.py`) matches developer skills and enforces available free capacity constraints (>20% threshold).
4. **Human Manager Governance**: Delivery managers review, refine, and formally approve the baseline before engineering team recommendations are unlocked.
5. **Rule-Based Operational Alerts**: Automated detection of overdue tasks (`due_date < simulated_date`), effort overruns (`logged > 120% estimated`), and blocked dependencies.
6. **Empirical Historical Calibration**: Completed project outcomes dynamically calibrate future estimation buffer multipliers.

---

## 2. Connected End-to-End Workflow

```
[ Client Document / RFP ]
          │ (PDF, DOCX, or Pasted Text)
          ▼
[ AI Requirement Extraction ] (Gemini / Structured Fallback Cache)
          │
          ▼
[ Deterministic Feasibility Engine ] (0.5 wk/pt, ₹25k/wk, 1.15-1.50 buffers)
          │
          ▼
[ Analysis & Review ] ──(Manager Edits Requirements & Auto-Recalculates)
          │
          ▼
[ Human Approval Modal ] ──(Freezes Immutable Baseline Snapshot)
          │
          ▼
[ Team Optimizer ] ──(Primary Squad vs Alternative Trade-offs)
          │
          ▼
[ Delivery Tracking Board ] ──(Backlog / In Progress / Done)
          │
          ├── [ Advance 7 Days Simulation ] ──> [ Overdue / Overrun Alerts ]
          ├── [ Log Hours Action ] ───────────> [ Effort Overrun Alerts ]
          │
          ▼
[ Project Completion Form ] ──> [ Historical Learning Engine (Past Projects) ]
```

---

## 3. Technology Stack

- **Backend**:
  - Python 3.10+ (tested on Python 3.12)
  - FastAPI & Pydantic v2
  - SQLAlchemy & SQLite (PostgreSQL-ready via `DATABASE_URL`)
  - `pdfplumber` (PDF text extraction)
  - `python-docx` (DOCX parsing)
  - `google-genai` (Responsible AI structured extraction)
- **Frontend**:
  - React 19 + TypeScript
  - Vite SPA
  - `react-router-dom` (5 connected routes)
  - Vanilla CSS design tokens (`#0F1B2D` Dark Navy, `#0F766E` Teal, `#F5F7FA` Light BG)
  - Recharts (Historical estimate vs actual calibration charts)
  - Axios API client with offline fallback resilience

---

## 4. Quick Start & Local Execution

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Configure environment variables in .env
# If GEMINI_API_KEY is not set, verified demo sample fallbacks will seamlessly engage.
cp .env.example .env

# Run FastAPI backend server (Port 8000)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- Health Check: `http://localhost:8000/health`
- Interactive Swagger Docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install Node modules
npm install

# Run Vite development server (Port 5173)
npm run dev
```
- Open browser at: `http://localhost:5173`

---

## 5. Running Automated Tests

Run the comprehensive pytest suite covering all feasibility boundaries, downgrade rules, approval locking, team optimization, alerts, and historical learning:

```bash
# Run all tests
python -m pytest backend/tests/test_master_spec.py -v --disable-warnings
```

---

## 6. Docker Deployment

```bash
docker-compose up --build
```
- Frontend available at: `http://localhost:5173`
- Backend API available at: `http://localhost:8000`

---

## 7. Demo Rehearsal Script

1. **Dashboard (`/`)**: View the active projects portfolio with status and verdict badges.
2. **New Project Intake (`/projects/new`)**: Click **"CityCare Hospitals"** to load the pre-configured sample report (or paste/upload your own document). Click **"Analyze & Calculate Feasibility"**.
3. **Review & Recalculate (`/projects/:id/review`)**:
   - Inspect the calculated effort range (9–12 weeks), cost range, and feasibility verdict.
   - Edit any requirement's complexity (e.g. from Medium to High). Observe real-time debounced recalculation from the backend without manual page refresh.
   - Click **"Approve Baseline"**, enter approver name, and submit. Notice that the analysis freezes and fields become read-only.
4. **Team Recommendation (`/projects/:id/team`)**:
   - Inspect recommended 3-4 member squad with skill match scores and capacity fractions.
   - Toggle to **"Alternative Squad"** and observe trade-off notes. Click **"Confirm Team & Launch Delivery"**.
5. **Delivery Tracking (`/projects/:id/delivery`)**:
   - View Kanban board with initialized milestone tasks.
   - Click **"Log Hours"** on a task and enter 120 hours (exceeding 1.2x threshold) to trigger the **Effort Overrun Alert**.
   - Click **"Advance 7 Days"** multiple times to advance the simulated timeline and observe the **Overdue Alert**.
   - Click **"Complete Project"**, enter actual duration and cost, and observe immediate update to the **Historical Learning Chart**.
