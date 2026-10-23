import json
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
from backend.schemas import (
    RequiredSkillItem, TeamMemberAssigned, AlternativeTeamOption, TeamRecommendationResponse
)

def load_developer_profiles() -> List[Dict[str, Any]]:
    dev_path = Path(__file__).parent / "data" / "developers.json"
    if dev_path.exists():
        with open(dev_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def calculate_developer_score(
    dev: Dict[str, Any],
    required_skills: List[RequiredSkillItem]
) -> Tuple[float, float, int]:
    """
    Returns (developer_score, skill_match, mandatory_skills_covered_by_this_dev).
    Mandatory skill weight = 3, nice-to-have = 1.
    Normalized against 5.
    developer_score = 0.7 * skill_match + 0.3 * free_capacity_fraction
    """
    if not required_skills:
        free_cap = dev.get("free_capacity_pct", 0) / 100.0
        return 0.3 * free_cap, 0.0, 0

    total_weighted_points = 0.0
    total_possible_weights = 0.0
    mandatory_covered = 0

    dev_skills = dev.get("skills", {})

    for req in required_skills:
        weight = 3.0 if req.mandatory else 1.0
        total_possible_weights += weight * 1.0

        # Case-insensitive skill match
        prof = 0
        for s_name, s_level in dev_skills.items():
            if s_name.lower() == req.name.lower():
                prof = s_level
                break

        if prof > 0 and req.mandatory:
            mandatory_covered += 1

        total_weighted_points += weight * (prof / 5.0)

    skill_match = total_weighted_points / total_possible_weights if total_possible_weights > 0 else 0.0
    free_capacity_frac = dev.get("free_capacity_pct", 0) / 100.0
    score = (0.7 * skill_match) + (0.3 * free_capacity_frac)

    return score, skill_match, mandatory_covered

def assemble_team(
    candidates: List[Dict[str, Any]],
    required_skills: List[RequiredSkillItem],
    min_size: int = 3,
    max_size: int = 5
) -> Tuple[List[TeamMemberAssigned], List[str], List[str]]:
    """
    Greedy team assembly:
    1. Filter out developers with < 20% capacity.
    2. Prefer developers covering the greatest number of uncovered mandatory skills.
    3. Tie-break by developer score.
    4. Allocate capacity without exceeding free capacity.
    """
    # 1. Filter out developers with < 20% free capacity
    eligible = [d for d in candidates if d.get("free_capacity_pct", 0) >= 20]
    
    # Precompute scores
    scored_devs = []
    for d in eligible:
        score, sm, _ = calculate_developer_score(d, required_skills)
        scored_devs.append({"dev": d, "score": score, "skill_match": sm})
    
    # Sort primarily by score descending initially
    scored_devs.sort(key=lambda x: x["score"], reverse=True)

    mandatory_skills = [req.name.lower() for req in required_skills if req.mandatory]
    covered_mandatory = set()
    selected_team: List[TeamMemberAssigned] = []
    capacity_violations: List[str] = []

    available_candidates = list(scored_devs)

    while available_candidates and len(selected_team) < max_size:
        # Determine for each candidate how many UNCOVERED mandatory skills they can cover
        def candidate_sort_key(item):
            d = item["dev"]
            d_skills = {k.lower(): v for k, v in d.get("skills", {}).items() if v > 0}
            uncovered_covered = sum(1 for m in mandatory_skills if m not in covered_mandatory and m in d_skills)
            return (uncovered_covered, item["score"])

        available_candidates.sort(key=candidate_sort_key, reverse=True)
        best_candidate = available_candidates.pop(0)
        d = best_candidate["dev"]

        # Allocate work: 80% of their free capacity, capped sensibly
        free_cap = d.get("free_capacity_pct", 100)
        alloc = min(free_cap, 80 if free_cap >= 80 else free_cap)

        if alloc > free_cap:
            capacity_violations.append(
                f"Developer {d['name']} ({d['id']}) allocated {alloc}% exceeding available {free_cap}%."
            )

        # Record which mandatory skills were covered
        d_skills = {k.lower(): v for k, v in d.get("skills", {}).items() if v > 0}
        covered_by_this = [m for m in mandatory_skills if m in d_skills]
        for m in covered_by_this:
            covered_mandatory.add(m)

        reason = (
            f"Strong fit with {best_candidate['score']*100:.1f} score ({best_candidate['skill_match']*100:.1f}% skill match, "
            f"{free_cap}% free capacity). Covers: {', '.join(d.get('skills', {}).keys())}."
        )

        selected_team.append(
            TeamMemberAssigned(
                developer_id=d["id"],
                name=d["name"],
                role=d["role"],
                allocated_capacity_pct=alloc,
                skills=d.get("skills", {}),
                reason=reason
            )
        )

        # If all mandatory skills are covered and we have reached min_size, we can complete
        if len(covered_mandatory) == len(mandatory_skills) and len(selected_team) >= min_size:
            break

    # If min_size not reached and more eligible candidates exist, fill up to min_size
    while available_candidates and len(selected_team) < min_size:
        best_candidate = available_candidates.pop(0)
        d = best_candidate["dev"]
        free_cap = d.get("free_capacity_pct", 100)
        alloc = min(free_cap, 60)
        selected_team.append(
            TeamMemberAssigned(
                developer_id=d["id"],
                name=d["name"],
                role=d["role"],
                allocated_capacity_pct=alloc,
                skills=d.get("skills", {}),
                reason=f"Added for team balance and reserve capacity ({free_cap}% free)."
            )
        )

    # Compute uncovered mandatory skills
    uncovered = [req.name for req in required_skills if req.mandatory and req.name.lower() not in covered_mandatory]

    return selected_team, uncovered, capacity_violations

def optimize_team(
    project_id: str,
    required_skills: List[RequiredSkillItem]
) -> TeamRecommendationResponse:
    all_developers = load_developer_profiles()

    # Best team
    best_team, uncovered, violations = assemble_team(all_developers, required_skills, min_size=3, max_size=4)

    mandatory_count = sum(1 for r in required_skills if r.mandatory)
    mandatory_covered = mandatory_count - len(uncovered)
    coverage_pct = round((mandatory_covered / mandatory_count * 100.0), 1) if mandatory_count > 0 else 100.0

    # Build Alternative team: exclude the top-scoring developer from the best team
    alt_pool = [d for d in all_developers if best_team and d["id"] != best_team[0].developer_id]
    alt_team, alt_uncovered, alt_violations = assemble_team(alt_pool, required_skills, min_size=3, max_size=4)

    alt_mandatory_covered = mandatory_count - len(alt_uncovered)
    alt_coverage_pct = round((alt_mandatory_covered / mandatory_count * 100.0), 1) if mandatory_count > 0 else 100.0

    # Tradeoff explanation
    if best_team and alt_team:
        excluded_lead = best_team[0].name
        alt_lead = alt_team[0].name
        tradeoff = (
            f"Alternative team replaces lead specialist {excluded_lead} with {alt_lead}. "
            f"Mandatory skill coverage is {alt_coverage_pct}% (vs {coverage_pct}% for recommended team). "
            f"{'Uncovered in alternative: ' + ', '.join(alt_uncovered) if alt_uncovered else 'All mandatory skills remain covered.'}"
        )
    else:
        tradeoff = "Alternative configuration using reserve engineering profiles."

    explanation = (
        f"Recommended a balanced {len(best_team)}-member engineering squad covering {coverage_pct}% of mandatory skills "
        f"({mandatory_covered}/{mandatory_count}). All allocated members satisfy the >20% capacity constraint."
    )
    if uncovered:
        explanation += f" Warning: Unable to cover the following mandatory skills in-house: {', '.join(uncovered)}."

    return TeamRecommendationResponse(
        project_id=project_id,
        best_team=best_team,
        alternative=AlternativeTeamOption(
            team=alt_team,
            tradeoff=tradeoff,
            score=round(sum(t.allocated_capacity_pct for t in alt_team) / (len(alt_team) or 1), 1),
            skills_covered_pct=alt_coverage_pct
        ),
        mandatory_skills_covered=mandatory_covered,
        total_mandatory_skills=mandatory_count,
        coverage_pct=coverage_pct,
        capacity_violations=violations,
        uncovered_skills=uncovered,
        explanation=explanation
    )
