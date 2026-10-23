import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, CheckCircle2, FastForward, Check,
  BarChart2, ShieldAlert, ArrowLeft, Lock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { apiClient } from '../api/client';
import type {
  ProjectDetailResponse, TaskItem, AlertItem, HistoryResponse, TaskStatus
} from '../types/contract';
import { formatINR } from '../utils/formatters';

export function DeliveryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);

  // Log hours modal
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [loggedHoursInput, setLoggedHoursInput] = useState<string>('');

  // Completion Form modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [actualWeeks, setActualWeeks] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const loadDeliveryData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [p, t, a, h] = await Promise.all([
        apiClient.getProject(id),
        apiClient.getProjectTasks(id),
        apiClient.getProjectAlerts(id),
        apiClient.getHistory()
      ]);
      setProject(p);
      setTasks(t);
      setAlerts(a);
      setHistory(h);

      if (p.effort_max_weeks) setActualWeeks(p.effort_max_weeks.toString());
      if (p.cost_max) setActualCost(p.cost_max.toString());
    } catch (err) {
      console.error('Failed to load delivery tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryData();
  }, [id]);

  const isCompleted = project?.status === 'completed';

  const handleSimulateAdvance = async () => {
    if (!id || isCompleted) return;
    setIsSimulating(true);
    try {
      await apiClient.simulateProjectTimeline(id, 7);
      // Reload project and alerts
      const [updatedProject, updatedTasks, updatedAlerts] = await Promise.all([
        apiClient.getProject(id),
        apiClient.getProjectTasks(id),
        apiClient.getProjectAlerts(id)
      ]);
      setProject(updatedProject);
      setTasks(updatedTasks);
      setAlerts(updatedAlerts);
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLogHoursSubmit = async () => {
    if (!selectedTask) return;
    const hrs = parseFloat(loggedHoursInput);
    if (isNaN(hrs) || hrs < 0) return;

    try {
      await apiClient.updateTask(selectedTask.id, { logged_hours: hrs });
      setSelectedTask(null);
      // Refresh tasks and alerts
      const [updatedTasks, updatedAlerts] = await Promise.all([
        apiClient.getProjectTasks(id!),
        apiClient.getProjectAlerts(id!)
      ]);
      setTasks(updatedTasks);
      setAlerts(updatedAlerts);
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Log hours failed.');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (isCompleted) return;
    try {
      await apiClient.updateTask(taskId, { status: newStatus });
      const [updatedTasks, updatedAlerts] = await Promise.all([
        apiClient.getProjectTasks(id!),
        apiClient.getProjectAlerts(id!)
      ]);
      setTasks(updatedTasks);
      setAlerts(updatedAlerts);
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Status change failed.');
    }
  };

  const handleCompleteProject = async () => {
    if (!id) return;
    const weeks = parseInt(actualWeeks, 10);
    const cost = parseFloat(actualCost);
    if (isNaN(weeks) || isNaN(cost) || weeks <= 0 || cost <= 0) {
      alert('Please enter valid positive numbers for actual weeks and actual cost.');
      return;
    }

    setIsCompleting(true);
    try {
      await apiClient.completeProject(id, weeks, cost);
      setShowCompleteModal(false);
      await loadDeliveryData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Project completion failed.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading delivery tracking board...
      </div>
    );
  }

  if (!project) return null;

  // Filter tasks into columns
  const backlogTasks = tasks.filter(t => t.status === 'backlog');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  // Prepare chart data for Historical Estimate vs Actual
  const chartData = (history?.projects || []).map(p => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name,
    Estimated: p.estimated_weeks,
    Actual: p.actual_weeks,
    Overrun: `${p.overrun_pct}%`
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 font-bold">{project.id}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">{project.client}</span>
            {isCompleted && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Completed & Read-Only
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#0F1B2D] mt-1">{project.title}</h1>
        </div>

        {/* Controls: Advance 7 Days Simulation & Complete Project */}
        <div className="flex items-center space-x-3">
          {!isCompleted ? (
            <>
              <button
                onClick={handleSimulateAdvance}
                disabled={isSimulating}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-teal-400 border border-slate-700 text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <FastForward className="w-4 h-4 text-teal-400" />
                <span>{isSimulating ? 'Simulating...' : 'Advance 7 Days'}</span>
              </button>

              <button
                onClick={() => setShowCompleteModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Complete Project</span>
              </button>
            </>
          ) : (
            <div className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Project Completed (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Baseline Metric & Simulation Offsets */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">Approved Baseline Effort</span>
          <div className="text-xl font-bold text-[#0F1B2D]">
            {project.effort_min_weeks}–{project.effort_max_weeks} weeks
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">Approved Baseline Cost</span>
          <div className="text-xl font-bold text-[#0F1B2D]">
            {formatINR(project.cost_min)} – {formatINR(project.cost_max)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">Simulated Timeline Offset</span>
          <div className="text-xl font-bold text-teal-700">
            +{project.sim_offset_days} Days
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">Delivery Status</span>
          <div className="text-xl font-bold uppercase text-[#0F1B2D]">
            {project.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Rule-Based Operational Alerts Panel */}
      {alerts.length > 0 ? (
        <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-red-900 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Operational Delivery Alerts Triggered ({alerts.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {alerts.map((alert, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-red-200 text-xs shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-900 capitalize">{alert.rule.replace('_', ' ')} Alert</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-tight">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All milestone delivery tasks are progressing within scheduled timelines and effort thresholds.</span>
        </div>
      )}

      {/* Delivery Task Board (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Backlog */}
        <div className="bg-slate-100/70 rounded-xl p-4 border border-slate-200 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Backlog ({backlogTasks.length})</h3>
          </div>
          <div className="space-y-3 flex-1">
            {backlogTasks.map(t => renderTaskCard(t))}
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-teal-50/40 rounded-xl p-4 border border-teal-200/60 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">In Progress ({inProgressTasks.length})</h3>
          </div>
          <div className="space-y-3 flex-1">
            {inProgressTasks.map(t => renderTaskCard(t))}
          </div>
        </div>

        {/* Done */}
        <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200/60 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Done ({doneTasks.length})</h3>
          </div>
          <div className="space-y-3 flex-1">
            {doneTasks.map(t => renderTaskCard(t))}
          </div>
        </div>
      </div>

      {/* Historical Estimate vs Actual Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F1B2D] flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-teal-700" />
              <span>Historical Estimate vs Actual Outcome Analysis</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical historical records used by DevMatrix AI to calibrate future project buffer multipliers.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-teal-800">
              Average Overrun: {history?.average_overrun_pct || 0}%
            </span>
            <span className="text-[11px] text-slate-400 block">Across {history?.project_count || 0} completed projects</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis unit=" wks" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Estimated" fill="#94A3B8" name="Estimated Weeks" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#0F766E" name="Actual Weeks" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal: Log Hours */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-[#0F1B2D]">Log Hours for Task</h3>
            <p className="text-xs text-slate-600 font-medium">{selectedTask.title}</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cumulative Logged Hours (Estimated: {selectedTask.estimated_hours}h)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={loggedHoursInput}
                onChange={(e) => setLoggedHoursInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleLogHoursSubmit}
                className="px-4 py-1.5 bg-[#0F766E] text-white rounded-lg text-xs font-bold hover:bg-teal-700"
              >
                Save Hours
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Complete Project */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-[#0F1B2D]">Complete Project & Record Actuals</h3>
            <p className="text-xs text-slate-500">
              Recording actual delivery duration and cost permanently stores this outcome into DevMatrix AI's historical learning engine.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Delivery Duration (Whole Weeks) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={actualWeeks}
                  onChange={(e) => setActualWeeks(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Realized Project Cost (INR ₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  required
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="e.g. 750000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                disabled={isCompleting}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteProject}
                disabled={isCompleting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isCompleting ? 'Finalizing...' : 'Save Actuals & Lock Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderTaskCard(t: TaskItem) {
    const isOverdue = alerts.some(a => a.task_id === t.id && a.rule === 'overdue');
    const isOverrun = alerts.some(a => a.task_id === t.id && a.rule === 'effort_overrun');

    return (
      <div
        key={t.id}
        className={`bg-white p-3.5 rounded-lg border shadow-xs space-y-2 transition-all ${
          isOverdue ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 font-bold">{t.id}</span>
          <span className="text-[11px] font-semibold text-teal-800">{t.owner_name}</span>
        </div>

        <h4 className="text-xs font-bold text-[#0F1B2D] leading-snug">{t.title}</h4>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className={isOverdue ? 'text-red-600 font-bold' : ''}>Due: {t.due_date}</span>
          </span>
          <span className={`font-mono font-medium ${isOverrun ? 'text-amber-700 font-bold' : ''}`}>
            {t.logged_hours}h / {t.estimated_hours}h
          </span>
        </div>

        {/* Task actions: Status transition and log hours */}
        {!isCompleted && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <select
              value={t.status}
              onChange={(e) => handleStatusChange(t.id, e.target.value as TaskStatus)}
              className="text-[10px] font-semibold bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none"
            >
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <button
              onClick={() => {
                setSelectedTask(t);
                setLoggedHoursInput(t.logged_hours.toString());
              }}
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 underline"
            >
              Log Hours
            </button>
          </div>
        )}
      </div>
    );
  }
}
