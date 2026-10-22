# DevMatrix AI — Deterministic Risk & Feasibility Engine Specification

## 1. Engine Philosophy & Core Principles

Traditional risk management in project planning relies on subjective gut feelings or black-box LLM hallucinations that output ungrounded percentages. **DevMatrix AI rejects arbitrary scoring.**

The DevMatrix AI Risk Engine operates under three mandatory principles:
1. **Deterministic & Explainable**: Given identical input records and ruleset version `1.0.0`, the engine produces identical numerical scores and risk classifications every time.
2. **Empirical Evidence Provenance**: Every identified risk must cite specific database keys (e.g. `EMP-001`, `HPJ-801`, `REQ-204`) proving *why* the risk was triggered.
3. **Transparent Uncertainty**: The engine distinguishes confirmed empirical facts, estimated ranges, and unconfirmed assumptions. Missing data is never invented; it is surfaced as an explicit blocker.

---

## 2. The 11 Risk Evaluation Dimensions

The engine evaluates 11 distinct dimensions. Each dimension produces a normalized **Risk Score** $S_d \in [0, 100]$ (where $0$ indicates zero risk / complete readiness, and $100$ indicates catastrophic risk).

```
                      +---------------------------------------+
                      |       PROJECT INTAKE & ORG DATA       |
                      +-------------------+-------------------+
                                          |
            +-----------------------------+-----------------------------+
            |                             |                             |
            v                             v                             v
+-----------------------+     +-----------------------+     +-----------------------+
| 1. Tech & Arch (15%)  |     | 2. Completeness (10%) |     | 3. Skill Fit (15%)    |
+-----------------------+     +-----------------------+     +-----------------------+
| 4. Capacity (15%)     |     | 5. Budget (10%)       |     | 6. Deadline (10%)     |
+-----------------------+     +-----------------------+     +-----------------------+
| 7. Infra/License (5%) |     | 8. Integration (5%)   |     | 9. Security/Comp (5%) |
+-----------------------+     +-----------------------+     +-----------------------+
| 10. History (5%)      |     | 11. Ops/DevOps (5%)   |     |                       |
+-----------------------+     +-----------------------+     +-----------------------+
            |                             |                             |
            +-----------------------------+-----------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      | COMPOSITE RISK SCORE & DECISION TREE  |
                      | - Check Hard Veto Criteria            |
                      | - Calculate Weighted Aggregate Score  |
                      | - Classify Feasibility Status         |
                      +---------------------------------------+
```

### Dimension 1: Technical Feasibility & Architectural Complexity ($S_1$)
- **Input Data**: Requirements complexity distribution (`low`, `medium`, `high`, `critical`), architectural pattern (monolith, microservices, event-driven), target throughput/concurrency.
- **Formula**:
  $$S_1 = \min\left(100, 20 \cdot N_{\text{crit}} + 10 \cdot N_{\text{high}} + 3 \cdot N_{\text{med}} + B_{\text{arch}}\right)$$
  Where:
  - $N_{\text{crit}}, N_{\text{high}}, N_{\text{med}}$ are counts of requirements with respective complexity levels.
  - $B_{\text{arch}}$ is architectural base penalty: $0$ for Modular Monolith, $+15$ for Microservices with Distributed Transactions, $+25$ for Multi-region Event-driven.

### Dimension 2: Requirements Completeness & Ambiguity ($S_2$)
- **Input Data**: Missing critical NFRs (e.g. peak RPS, SLA, backup RPO/RTO), flagged ambiguous acceptance criteria, unresolved clarification count.
- **Formula**:
  $$S_2 = \min\left(100, \frac{N_{\text{ambiguous}} + N_{\text{missing\_critical}} \times 2}{N_{\text{total\_requirements}}} \times 100\right)$$
- If critical NFRs like peak traffic are missing, $S_2$ is assigned a minimum floor of $45.0$.

### Dimension 3: Skill Availability & Expertise Gaps ($S_3$)
- **Input Data**: For each requirement $r \in R$, required skill $k_r$ and minimum proficiency $P_r \in [1, 5]$ compared against organization employees' verified proficiencies $\max_{e} P(e, k_r)$.
- **Formula**:
  $$\text{Deficit}(r) = \max\left(0, P_r - \max_{e \in \text{Org}} P(e, k_r)\right)$$
  $$S_3 = \min\left(100, \sum_{r \in R} \left(\text{Deficit}(r) \times 25\right) + \left(N_{\text{zero\_coverage}} \times 40\right)\right)$$
- If a required skill has **zero** qualified individuals in the entire organization, $N_{\text{zero\_coverage}} \ge 1 \implies S_3 \ge 65.0$ (High Risk).

### Dimension 4: Employee Capacity & Workload Conflicts ($S_4$)
- **Input Data**: Estimated weekly effort per skill domain ($E_{\text{weekly, domain}}$) versus sum of uncommitted remaining weekly hours of qualified employees ($\sum \text{RemainingHours}(e)$).
- **Time Period & Units**: Evaluated in **person-hours per week (`hrs/week`)** over the active calendar date window of the project $[t_{\text{start}}, t_{\text{end}}]$ (for PRJ-101: 8.5 calendar weeks).
- **Capacity Definition**:
  $$\text{WeeklyGrossCapacity}(e) = \text{weekly\_capacity\_hours} \quad (\text{default } 40.0 \text{ hrs/week})$$
  $$\text{WeeklyAllocated}(e, [t_{\text{start}}, t_{\text{end}}]) = \sum_{a \in \text{Assignments}(e), a.\text{overlaps}([t_{\text{start}}, t_{\text{end}}])} a.\text{assigned\_hours\_per\_week}$$
  $$\text{RemainingHours}(e) = \max\left(0.0, \; \text{WeeklyGrossCapacity}(e) - \text{WeeklyAllocated}(e, [t_{\text{start}}, t_{\text{end}}])\right)$$
- **Formula**:
  $$\text{DeficitRatio}_{\text{domain}} = \frac{E_{\text{weekly, domain}}}{\max(1.0, \sum_{e \in \text{Qualified}} \text{RemainingHours}(e))}$$
  $$S_4 = \begin{cases} 
  0 & \text{if } \text{DeficitRatio} \le 0.80 \\
  50 \times (\text{DeficitRatio} - 0.80) & \text{if } 0.80 < \text{DeficitRatio} \le 1.00 \\
  50 + 50 \times \min(1.0, \text{DeficitRatio} - 1.00) & \text{if } \text{DeficitRatio} > 1.00
  \end{cases}$$

### Dimension 5: Budget & Cost Viability ($S_5$)
- **Input Data**: Nominal estimated total project cost ($C_{\text{nominal}}$) versus project budget ceiling ($B_{\text{ceiling}}$).
- **Formula**:
  $$R_{\text{cost}} = \frac{C_{\text{nominal}}}{B_{\text{ceiling}}}$$
  $$S_5 = \begin{cases}
  0 & \text{if } R_{\text{cost}} \le 0.75 \\
  100 \times \left(\frac{R_{\text{cost}} - 0.75}{0.50}\right) & \text{if } 0.75 < R_{\text{cost}} \le 1.25 \\
  100 & \text{if } R_{\text{cost}} > 1.25
  \end{cases}$$

### Dimension 6: Deadline & Schedule Feasibility ($S_6$)
- **Input Data**: Critical path duration in calendar days ($D_{\text{critical}}$) calculated from task dependencies versus target deadline duration ($D_{\text{target}}$).
- **Formula**:
  $$R_{\text{schedule}} = \frac{D_{\text{critical}}}{D_{\text{target}}}$$
  $$S_6 = \begin{cases}
  0 & \text{if } R_{\text{schedule}} \le 0.80 \\
  100 \times \left(\frac{R_{\text{schedule}} - 0.80}{0.40}\right) & \text{if } 0.80 < R_{\text{schedule}} \le 1.20 \\
  100 & \text{if } R_{\text{schedule}} > 1.20
  \end{cases}$$

### Dimension 7: Infrastructure, Tooling & License Readiness ($S_7$)
- **Input Data**: Status of required cloud environments and enterprise licenses from `infrastructure_resources`.
- **Formula**:
  $$S_7 = \sum_{res \in \text{Required}} \text{Penalty}(res)$$
  Where:
  - $\text{Penalty} = 0$ if `status = 'ready'`
  - $\text{Penalty} = 25$ if `status = 'under_provisioning'`
  - $\text{Penalty} = 50$ if `status = 'expired'` or `'unconfirmed'`

### Dimension 8: External Integration & Dependency Risk ($S_8$)
- **Input Data**: Count of external third-party APIs (payment gateways, logistics webhooks, SMS providers, external ERPs) without signed sandbox SLA.
- **Formula**:
  $$S_8 = \min\left(100, N_{\text{external\_integrations}} \times 20 + N_{\text{untested\_gateways}} \times 25\right)$$

### Dimension 9: Security, Privacy & Compliance Concerns ($S_9$)
- **Input Data**: Compliance tier (e.g. PCI-DSS Level 1, HIPAA, GDPR) compared with active certified environments and certified personnel (`employee_certifications`).
- **Formula**:
  $$S_9 = \begin{cases}
  0 & \text{if no high compliance requirements} \\
  15 & \text{if certified env exists AND certified lead engineer exists} \\
  60 & \text{if compliance required but env uncertified} \\
  90 & \text{if compliance required, env uncertified AND no certified personnel}
  \end{cases}$$

### Dimension 10: Historical Project Patterns & Delay Recurrence ($S_{10}$)
- **Input Data**: Query `historical_projects` for records matching the target domain and technology stack.
- **Formula**:
  $$S_{10} = \text{Average Schedule Variance } (\%) \text{ of matching historical projects}$$
  If a past project with identical tech stack experienced a $+45\%$ schedule slip due to vendor integration, $S_{10} = 45.0$.

### Dimension 11: Operational, Monitoring & Deployment Readiness ($S_{11}$)
- **Input Data**: Availability of staging CI/CD pipelines, automated testing suites, and APM tools.
- **Formula**:
  $$S_{11} = 100 - (\text{Score}_{\text{CI/CD}} + \text{Score}_{\text{APM}} + \text{Score}_{\text{StagingParity}})$$

---

## 3. Composite Feasibility Score & Decision Tree

### 3.1 Dimension Weights
The overall composite risk score $S_{\text{overall}}$ is a weighted linear combination:

| Dimension | Key ($d$) | Weight ($W_d$) | Justification |
| :--- | :--- | :--- | :--- |
| Technical Complexity | $S_1$ | **15%** | Architectural failure causes systemic rewrites |
| Requirements Completeness | $S_2$ | **10%** | Ambiguity leads to scope creep |
| Skill Availability | $S_3$ | **15%** | Missing talent prevents execution |
| Employee Capacity | $S_4$ | **15%** | Overloaded staff causes project stalls |
| Budget & Cost | $S_5$ | **10%** | Commercial viability constraint |
| Deadline Feasibility | $S_6$ | **10%** | Critical path calendar boundary |
| Infrastructure & Licenses | $S_7$ | **5%** | Environmental prerequisite |
| External Dependencies | $S_8$ | **5%** | Third-party friction |
| Security & Compliance | $S_9$ | **5%** | Legal/regulatory exposure |
| Historical Patterns | $S_{10}$ | **5%** | Empirical track record calibration |
| Operational Readiness | $S_{11}$ | **5%** | Day-2 maintainability |

$$S_{\text{overall}} = \sum_{d=1}^{11} W_d \times S_d$$

### 3.2 Feasibility Status Decision Rules

The engine chooses the project status using a deterministic decision tree:

```
[Start Evaluation]
       │
       ▼
Is Completeness Score < 50% OR Critical Data Missing?
  ├── YES ──> Status: 'insufficient_information'
  └── NO
       │
       ▼
Does any Fatal Veto Rule apply?
(S_overall >= 75 OR S_4 >= 90 OR S_9 >= 90 OR Cost > 135% Budget)
  ├── YES ──> Status: 'not_feasible'
  └── NO
       │
       ▼
Does any Conditional Warning apply?
(35 <= S_overall < 75 OR Specific resolvable gaps: S_3 > 40 or S_4 > 40)
  ├── YES ──> Status: 'feasible_with_conditions'
  └── NO
       │
       ▼
Status: 'feasible'
```

1. **`insufficient_information`**:
   - Triggered if Dimension 2 completeness score $< 50\%$ OR critical parameters (budget, target date, primary functional requirements) are absent.
   - Action: Halts further execution; outputs specific clarification queries.
2. **`not_feasible`**:
   - Triggered if $S_{\text{overall}} \ge 75.0$, OR cost estimate $> 135\%$ of budget, OR schedule $> 140\%$ of target timeline with no compression possible, OR any single unmitigatable fatal risk exists.
   - Action: Recommends formal project rejection or wholesale renegotiation.
3. **`feasible_with_conditions`**:
   - Triggered if $35.0 \le S_{\text{overall}} < 75.0$, OR individual dimension risks exist that can be resolved through explicit management interventions (e.g. hiring an external contractor, extending deadline by 2 weeks, de-scoping non-critical NFRs).
   - Action: Generates binding pre-approval conditions.
4. **`feasible`**:
   - Triggered if $S_{\text{overall}} < 35.0$ AND no dimension exceeds $50.0$.
   - Action: Cleared for immediate manager approval.

---

## 4. PERT Three-Point Estimation & Range Calculations

To avoid false precision, effort and cost are computed using PERT (Program Evaluation and Review Technique) three-point distributions.

For each requirement or task $i$:
- $O_i$: Optimistic effort in person-hours (everything proceeds without blockers).
- $M_i$: Most likely (nominal) effort in person-hours.
- $P_i$: Pessimistic effort in person-hours (worst-case integration failures and rework).

### 4.1 Expected Value & Uncertainty Modeling
$$\mu_i = \frac{O_i + 4M_i + P_i}{6}$$
$$\sigma_i = \frac{P_i - O_i}{6}$$

Total Project Expected Effort:
$$E_{\text{total}} = \sum_{i=1}^N \mu_i, \quad \sigma_{\text{total}} = \sqrt{\sum_{i=1}^N \sigma_i^2}$$

**Indicative Effort Range (Heuristic Spread)**:
$$\text{Indicative Effort Spread} = \left[ E_{\text{total}} - 1.96 \cdot \sigma_{\text{total}}, \; E_{\text{total}} + 1.96 \cdot \sigma_{\text{total}} \right]$$

> [!NOTE]
> **Statistical Methodology Note**: In classical project PERT, a $\pm 1.96\sigma$ spread reflects an asymptotic 95% interval under the theoretical assumption that task durations are independent, identically distributed Beta random variables summing to a Normal distribution via the Central Limit Theorem. In software engineering, tasks share shared technical dependencies, and an 8-task scope ($N=8$) does not satisfy asymptotic sample size requirements ($N \ge 30$). DevMatrix AI therefore treats this range as an **indicative planning interval** illustrating optimistic vs. pessimistic bounds, rather than a calibrated empirical 95% confidence interval.

### 4.2 Cost Range & Effort Fields
Labor cost combines task effort with blended hourly rates $H(r)$ of qualified roles:
$$C_{\text{nominal}} = \sum_{i=1}^N \mu_i \times H(\text{role}_i) + \text{Cost}_{\text{infra}}$$

Standard effort field conventions across database and API:
- `estimated_effort_hours_optimistic` ($E_{\text{total}} - 1.96\sigma_{\text{total}}$ or $\sum O_i$)
- `estimated_effort_hours_nominal` ($E_{\text{total}} = \sum \mu_i$)
- `estimated_effort_hours_pessimistic` ($E_{\text{total}} + 1.96\sigma_{\text{total}}$ or $\sum P_i$)

---

## 5. Concrete Demonstration Calculation Walkthrough

Below are the exact mathematical inputs and calculations using the **ShopNova E-Commerce Suite** demo scenario:

### 5.1 Project Parameters
- Target Budget: **$85,000.00**
- Target Timeline: **60 Calendar Days** (approx. 8.5 calendar weeks)
- Intake Scope: 8 Requirements (`REQ-201` to `REQ-208`)

### 5.2 Dimension Scoring Breakdown

1. **Technical & Architecture ($S_1$)**:
   - Microservices architecture base penalty: $+15$
   - 2 Critical requirements (`REQ-201` Payment, `REQ-204` Order Engine): $2 \times 20 = 40$
   - 3 High requirements (`REQ-202` Search, `REQ-203` Checkout, `REQ-207` Auth): $3 \times 10 = 30$
   - $S_1 = \min(100, 15 + 40 + 30) = \mathbf{85.0}$

2. **Requirements Completeness ($S_2$)**:
   - `REQ-206` (Traffic & Concurrency) is missing peak RPS specifications ($N_{\text{missing}} = 1$).
   - Total requirements = 8.
   - $S_2 = \min(100, (0 + 1 \times 2)/8 \times 100) = 25.0 \implies$ Assigned floor for missing critical NFR = $\mathbf{45.0}$.

3. **Skill Availability ($S_3$)**:
   - `REQ-201` requires `SKL-105` (Payment Gateway & PCI-DSS) at Proficiency 4.
   - Highest employee proficiency in Org is `EMP-001` with Proficiency 2. Deficit = $4 - 2 = 2$.
   - Deficit penalty = $2 \times 25 = 50.0$.
   - $S_3 = \mathbf{50.0}$.

4. **Employee Capacity ($S_4$)**:
   - Backend requirements demand approx. **28 hours/week** over 8 weeks.
   - Lead Backend Engineer `EMP-001` (Arjun Mehta) has only **10 hours/week** remaining due to commitment `ASN-001` on active project `PRJ-090`.
   - Deficit ratio = $28.0 / 10.0 = 2.80$.
   - $S_4 = 50 + 50 \times \min(1.0, 2.80 - 1.0) = \mathbf{100.0}$ (Critical capacity bottleneck).

5. **Budget & Cost ($S_5$)**:
   - Total Nominal Effort = $540$ person-hours.
   - Blended labor rate = $75.00/hr.
   - Nominal Labor Cost = $540 \times 75 = \$40,500.00$.
   - Infrastructure & SaaS licenses = $\$4,200.00$.
   - Total Nominal Cost = $\$44,700.00$ vs Budget $\$85,000.00$.
   - Cost Ratio = $\$44,700 / \$85,000 = 0.525 \le 0.75 \implies S_5 = \mathbf{0.0}$ (Well within budget).

6. **Deadline & Schedule ($S_6$)**:
   - Critical path duration = 65 calendar days vs Target = 60 days.
   - Schedule Ratio = $65 / 60 = 1.083$.
   - $S_6 = 100 \times \frac{1.083 - 0.80}{0.40} = 100 \times 0.708 = \mathbf{70.8}$.

7. **Infrastructure Readiness ($S_7$)**:
   - `RES-403` (Enterprise Search license) is `status='unconfirmed'`.
   - Penalty = $\mathbf{50.0}$.

8. **External Integration Risk ($S_8$)**:
   - Stripe 3D-Secure 2.0 and external inventory webhook ($N=2$).
   - $S_8 = 2 \times 20 = \mathbf{40.0}$.

9. **Security & Compliance ($S_9$)**:
   - PCI-DSS Level 1 compliance required for card data storage.
   - Staging environment is not certified (`RES-402` has `pci_certified=false`).
   - No engineer holds a current PCI-DSS certification (`CRT-xxx` empty).
   - $S_9 = \mathbf{90.0}$ (Severe compliance exposure).

10. **Historical Patterns ($S_{10}$)**:
    - Historical project `HPJ-801` (QuickMart Portal) experienced a $+45\%$ schedule delay specifically due to Stripe 3D-Secure webhook reconciliation failures.
    - $S_{10} = \mathbf{45.0}$.

11. **Operational Readiness ($S_{11}$)**:
    - CI/CD exists on staging; APM not configured.
    - $S_{11} = \mathbf{30.0}$.

---

### 5.3 Composite Score Calculation & Status Outcome

#### Baseline Analysis Calculation:
$$S_{\text{overall}} = (0.15 \times 85) + (0.10 \times 45) + (0.15 \times 50) + (0.15 \times 100) + (0.10 \times 0) + (0.10 \times 70.8) + (0.05 \times 50) + (0.05 \times 40) + (0.05 \times 90) + (0.05 \times 45) + (0.05 \times 30)$$

$$\begin{aligned}
S_{\text{overall}} &= 12.75 + 4.50 + 7.50 + 15.00 + 0.00 + 7.08 + 2.50 + 2.00 + 4.50 + 2.25 + 1.50 \\
&= \mathbf{59.58} \quad (\text{Presented in UI / API as } \mathbf{59.6})
\end{aligned}$$

#### Decision Rule Evaluation:
- Is Completeness $< 50\%$? No ($82\%$ complete).
- Is $S_{\text{overall}} \ge 75.0$? No ($59.58 < 75$).
- Can the capacity and compliance gaps be resolved?
  - Yes: Budget headroom is ample ($\$40,300$ surplus).
  - An external PCI-DSS certified consultant can be hired for $\$12,000$ to lead `REQ-201` and satisfy `REQ-207`.
  - Reallocating 15h/week of `EMP-001` from `PRJ-090` relieves the backend bottleneck.
  - Confirming the Elasticsearch license resolves `RES-403`.

**Deterministic Baseline Outcome**:
$$\mathbf{Status = \text{feasible\_with\_conditions}}$$
$$\mathbf{Score = 59.6 / 100 \quad (59.58 \text{ exact})}$$
$$\mathbf{Action = \text{proceed\_with\_conditions}}$$

---

### 5.4 What-If Scenario Mitigation Recalculation

When the manager simulates the recommended mitigations in the sandbox, the engine deterministically recalculates:
1. **Contractor PCI-DSS Specialist Hired**:
   - $S_3$ (Skill deficit for `SKL-105`) drops from $50.0 \rightarrow 0.0$ ($\Delta = -7.50$ points).
   - $S_9$ (PCI-DSS compliance exposure) drops from $90.0 \rightarrow 15.0$ ($\Delta = 0.05 \times -75 = -3.75$ points).
2. **Reallocate 15h/week for Arjun Mehta (`EMP-001`)**:
   - Available backend capacity becomes $25.0\text{ h/week} + 10.0\text{ h/week (Rohan Das)} = 35.0\text{ h/week}$ vs $28.2\text{ h/week}$ required.
   - Deficit ratio = $28.2 / 35.0 = 0.806 \le 0.81$.
   - $S_4$ drops from $100.0 \rightarrow 0.0$ ($\Delta = -15.00$ points).
3. **Confirm Elasticsearch License (`RES-403`)**:
   - $S_7$ drops from $50.0 \rightarrow 0.0$ ($\Delta = -2.50$ points).

$$\Delta S_{\text{total}} = -7.50 - 3.75 - 15.00 - 2.50 = \mathbf{-28.75}$$
$$S_{\text{mitigated}} = 59.58 - 28.75 = \mathbf{30.83} \quad (\text{Presented in UI as } \mathbf{30.8})$$

The project transitions to:
$$\mathbf{Mitigated Status = \text{feasible} \quad (30.8 < 35.0)}$$
