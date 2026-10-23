import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { apiClient } from '../api/client';
import type { ProjectListItem, ProjectStatus, FeasibilityVerdict } from '../types/contract';
import { formatINR, formatDate } from '../utils/formatters';

export function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.listProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleRowClick = (project: ProjectListItem) => {
    if (project.status === 'submitted' || project.status === 'analyzed') {
      navigate(`/projects/${project.id}/review`);
    } else if (project.status === 'approved') {
      navigate(`/projects/${project.id}/team`);
    } else {
      navigate(`/projects/${project.id}/delivery`);
    }
  };

  const getVerdictBadge = (verdict?: FeasibilityVerdict) => {
    if (!verdict) return <span className="text-xs text-slate-400">Pending</span>;
    if (verdict === 'feasible') {
      return (
        <span className="badge-feasible">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Feasible
        </span>
      );
    }
    if (verdict === 'conditional') {
      return (
        <span className="badge-conditional">
          <AlertTriangle className="w-3.5 h-3.5" />
          Conditional
        </span>
      );
    }
    return (
      <span className="badge-not-feasible">
        <XCircle className="w-3.5 h-3.5" />
        Not Feasible
      </span>
    );
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const config: Record<ProjectStatus, { bg: string; text: string; label: string }> = {
      submitted: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Submitted' },
      analyzed: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Analyzed' },
      approved: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Approved' },
      team_assigned: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Team Assigned' },
      in_delivery: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'In Delivery' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', label: 'Completed' }
    };
    const c = config[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  // Metrics
  const totalCount = projects.length;
  const analyzedCount = projects.filter(p => p.status === 'analyzed' || p.status === 'submitted').length;
  const inDeliveryCount = projects.filter(p => p.status === 'in_delivery' || p.status === 'team_assigned').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Software Projects Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise presales intake, deterministic feasibility calculations, team optimization, and delivery tracking.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProjects}
            disabled={isLoading}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/projects/new"
            className="px-4 py-2 bg-[#0F766E] hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Project Intake</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Projects</span>
          <div className="text-2xl font-bold text-[#0F1B2D] mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Intake & Review</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{analyzedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">In Delivery</span>
          <div className="text-2xl font-bold text-[#0F766E] mt-1">{inDeliveryCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Completed & Learned</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F1B2D]">Active Projects Portfolio</h2>
          <span className="text-xs text-slate-400">Click a row to navigate based on project lifecycle</span>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchProjects} className="font-semibold underline ml-2">Retry</button>
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading project portfolio from database...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">No projects found in database</p>
            <p className="text-xs text-slate-400 mt-1">Start by creating a new project from a client requirement report.</p>
            <Link
              to="/projects/new"
              className="mt-4 inline-flex items-center px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg hover:bg-teal-700"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Project ID & Title</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">Effort Range</th>
                  <th className="py-3 px-4">Cost Range</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleRowClick(p)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F1B2D] group-hover:text-[#0F766E] transition-colors">
                        {p.title}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{p.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{p.client}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3.5 px-4">{getVerdictBadge(p.verdict)}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {p.effort_min_weeks && p.effort_max_weeks
                        ? `${p.effort_min_weeks}–${p.effort_max_weeks} wks`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {p.cost_min && p.cost_max
                        ? `${formatINR(p.cost_min)} – ${formatINR(p.cost_max)}`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold">{p.deadline_weeks}</span> wks
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatDate(p.updated_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center text-[#0F766E] font-semibold text-xs group-hover:underline">
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
