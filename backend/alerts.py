from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from backend.models import Task
from backend.schemas import AlertItem, RiskSeverity, TaskStatus

def get_simulated_date(sim_offset_days: int = 0) -> datetime:
    """Computes project simulated date based on sim_offset_days."""
    return datetime.now(timezone.utc) + timedelta(days=sim_offset_days)

def evaluate_task_alerts(tasks: List[Task], sim_offset_days: int = 0) -> List[AlertItem]:
    """
    Evaluates rule-based operational delivery alerts.
    Rules:
    1. Overdue: Unfinished task whose due_date < simulated_date (severity: high)
    2. Effort Overrun: logged_hours > estimated_hours * 1.2 (severity: medium)
    3. Blocked: dependent task unfinished while current task is in progress (severity: medium)
    """
    sim_now = get_simulated_date(sim_offset_days)
    sim_date_str = sim_now.strftime("%Y-%m-%d")
    alerts: List[AlertItem] = []

    task_status_map = {t.id: t.status for t in tasks}

    for task in tasks:
        # Rule 1: Overdue Task
        if task.status != TaskStatus.DONE.value and task.status != "done":
            if task.due_date and task.due_date < sim_date_str:
                alerts.append(
                    AlertItem(
                        task_id=task.id,
                        task_name=task.title,
                        severity=RiskSeverity.HIGH,
                        rule="overdue",
                        message=f"Task '{task.title}' is overdue! Due date was {task.due_date}, but simulated date is {sim_date_str}."
                    )
                )

        # Rule 2: Effort Overrun
        if task.estimated_hours > 0:
            threshold = task.estimated_hours * 1.2
            if task.logged_hours > threshold:
                overrun_hrs = task.logged_hours - task.estimated_hours
                alerts.append(
                    AlertItem(
                        task_id=task.id,
                        task_name=task.title,
                        severity=RiskSeverity.MEDIUM,
                        rule="effort_overrun",
                        message=(
                            f"Task '{task.title}' has exceeded effort budget by {overrun_hrs:.1f}h "
                            f"({task.logged_hours:.1f}h logged vs {task.estimated_hours:.1f}h estimated, >120% threshold)."
                        )
                    )
                )

        # Rule 3: Dependency Blocked
        if task.dependencies and task.status != TaskStatus.DONE.value and task.status != "done":
            unmet_deps = [dep_id for dep_id in task.dependencies if task_status_map.get(dep_id) != "done"]
            if unmet_deps:
                alerts.append(
                    AlertItem(
                        task_id=task.id,
                        task_name=task.title,
                        severity=RiskSeverity.MEDIUM,
                        rule="dependency_blocked",
                        message=f"Task '{task.title}' is blocked pending incomplete prerequisite tasks ({', '.join(unmet_deps)})."
                    )
                )

    return alerts
