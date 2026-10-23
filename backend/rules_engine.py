import math
from typing import List, Optional
from backend.config import settings
from backend.schemas import (
    RequirementItem, RiskItem, CalculationDetail, ComplexityLevel, FeasibilityVerdict
)

POINT_MAP = {
    ComplexityLevel.LOW: settings.COMPLEXITY_LOW_PTS,       # 1
    ComplexityLevel.MEDIUM: settings.COMPLEXITY_MED_PTS,   # 3
    ComplexityLevel.HIGH: settings.COMPLEXITY_HIGH_PTS,     # 5
    "low": settings.COMPLEXITY_LOW_PTS,
    "medium": settings.COMPLEXITY_MED_PTS,
    "high": settings.COMPLEXITY_HIGH_PTS,
}

def calculate_feasibility(
    requirements: List[RequirementItem],
    risks: List[RiskItem],
    deadline_weeks: int,
    budget_max: float,
    historical_overrun: Optional[float] = None,
    historical_count: int = 0
) -> CalculationDetail:
    """
    Deterministic Python Feasibility Engine.
    All calculations are reproducible, explainable, and testable.
    """
    # 1. Total complexity points
    total_points = sum(POINT_MAP.get(r.complexity, settings.COMPLEXITY_MED_PTS) for r in requirements)
    
    # 2. Integration count & overhead
    integrations = sum(1 for r in requirements if r.integration)
    integration_overhead = integrations * settings.INTEGRATION_EFFORT # 1.5 person-weeks each
    
    # 3. Person-weeks
    person_weeks = (total_points * settings.EFFORT_PER_POINT) + integration_overhead # 0.5 per point
    
    # 4. Effective developers and calendar weeks
    effective_devs = settings.ASSUMED_TEAM_SIZE # 2.4
    calendar_weeks = person_weeks / effective_devs if effective_devs > 0 else 0.0

    # 5. Historical adjustment if available
    historical_adjustment_applied = False
    historical_overrun_pct = 0.0
    effective_calendar_weeks = calendar_weeks

    if historical_overrun is not None and historical_count > 0:
        historical_adjustment_applied = True
        historical_overrun_pct = round(historical_overrun * 100.0, 2)
        effective_calendar_weeks = calendar_weeks * (1.0 + historical_overrun)

    # 6. Effort range (math.ceil)
    min_weeks = math.ceil(effective_calendar_weeks * settings.BUFFER_MIN) # 1.15
    max_weeks = math.ceil(effective_calendar_weeks * settings.BUFFER_MAX) # 1.50

    # Handle empty/degenerate cases
    if min_weeks == 0 and requirements:
        min_weeks = 1
    if max_weeks < min_weeks:
        max_weeks = min_weeks

    # 7. Cost calculation (₹25,000 per person-week)
    min_cost = person_weeks * settings.BUFFER_MIN * settings.DEFAULT_WEEKLY_RATE
    max_cost = person_weeks * settings.BUFFER_MAX * settings.DEFAULT_WEEKLY_RATE

    # 8. Base verdict against deadline
    if max_weeks <= deadline_weeks:
        base_verdict = FeasibilityVerdict.FEASIBLE
        rule_fired = "MAX_WEEKS_LEQ_DEADLINE"
    elif min_weeks <= deadline_weeks:
        base_verdict = FeasibilityVerdict.CONDITIONAL
        rule_fired = "MIN_WEEKS_LEQ_DEADLINE"
    else:
        base_verdict = FeasibilityVerdict.NOT_FEASIBLE
        rule_fired = "MIN_WEEKS_GT_DEADLINE"

    verdict = base_verdict
    budget_downgrade = False
    risk_downgrade = False
    reason_notes = []

    # 9. Budget downgrade rule: if min_cost > budget_max, downgrade by 1 level
    if budget_max > 0 and min_cost > budget_max:
        budget_downgrade = True
        if verdict == FeasibilityVerdict.FEASIBLE:
            verdict = FeasibilityVerdict.CONDITIONAL
            rule_fired += " + BUDGET_DOWNGRADE_TO_CONDITIONAL"
        elif verdict == FeasibilityVerdict.CONDITIONAL:
            verdict = FeasibilityVerdict.NOT_FEASIBLE
            rule_fired += " + BUDGET_DOWNGRADE_TO_NOT_FEASIBLE"
        reason_notes.append(
            f"Minimum estimated cost (₹{min_cost:,.0f}) exceeds the maximum budget envelope (₹{budget_max:,.0f})."
        )

    # 10. Risk downgrade rule: if >= 3 high-severity risks, downgrade feasible to conditional
    high_risks = [r for r in risks if str(r.severity).lower() in ["high", "riskseverity.high"]]
    if len(high_risks) >= 3:
        if verdict == FeasibilityVerdict.FEASIBLE:
            risk_downgrade = True
            verdict = FeasibilityVerdict.CONDITIONAL
            rule_fired += " + RISK_DOWNGRADE_TO_CONDITIONAL"
            reason_notes.append(
                f"Project contains {len(high_risks)} high-severity risks triggering governance caution."
            )

    # Plain-language explanation rationale
    if verdict == FeasibilityVerdict.FEASIBLE:
        reason = f"Project is feasible within the {deadline_weeks}-week deadline (effort range: {min_weeks}–{max_weeks} weeks) and budget envelope."
    elif verdict == FeasibilityVerdict.CONDITIONAL:
        if reason_notes:
            reason = f"Conditional feasibility: {'; '.join(reason_notes)} Schedule requires {min_weeks}–{max_weeks} weeks vs {deadline_weeks}-week target."
        else:
            reason = f"Conditional feasibility: Delivery requires {min_weeks}–{max_weeks} weeks, requiring scope trimming or added staffing to guarantee the {deadline_weeks}-week deadline."
    else:
        if reason_notes:
            reason = f"Not feasible: {'; '.join(reason_notes)} Minimum effort ({min_weeks} weeks) significantly exceeds target deadline ({deadline_weeks} weeks)."
        else:
            reason = f"Not feasible: Minimum required time ({min_weeks} weeks) exceeds the {deadline_weeks}-week deadline."

    return CalculationDetail(
        total_points=total_points,
        person_weeks=round(person_weeks, 2),
        integrations=integrations,
        integration_overhead=round(integration_overhead, 2),
        effective_developers=effective_devs,
        calendar_weeks=round(calendar_weeks, 2),
        min_weeks=min_weeks,
        max_weeks=max_weeks,
        min_cost=round(min_cost, 2),
        max_cost=round(max_cost, 2),
        buffer_min=settings.BUFFER_MIN,
        buffer_max=settings.BUFFER_MAX,
        rate_per_week=settings.DEFAULT_WEEKLY_RATE,
        historical_adjustment_applied=historical_adjustment_applied,
        historical_overrun_pct=historical_overrun_pct,
        historical_project_count=historical_count,
        deadline_weeks=deadline_weeks,
        budget_max=budget_max,
        base_verdict=base_verdict.value,
        budget_downgrade=budget_downgrade,
        risk_downgrade=risk_downgrade,
        verdict=verdict.value,
        rule_fired=rule_fired,
        reason=reason
    )
