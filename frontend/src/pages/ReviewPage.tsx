import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, Lock, Plus, Trash2,
  Info, ShieldAlert, ChevronDown, ChevronUp, Check, Users
} from 'lucide-react';
import { apiClient } from '../api/client';
import type {
  ProjectDetailResponse, AnalysisResponse, RequirementItem, ComplexityLevel,
  PriorityLevel, RequirementType, FeasibilityVerdict
} from '../types/contract';
import { formatINR } from '../utils/formatters';

export function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-save debounce state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceTimer = useRef<any>(null);

  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approverName, setApproverName] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Expand calculation explanation
  const [showCalcDetails, setShowCalcDetails] = useState(false);

  // Resolved notes for gaps/conflicts
  const [resolvedItems, setResolvedItems] = useState<Record<string, boolean>>({});

  const loadProjectAndAnalysis = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const p = await apiClient.getProject(id);
      setProject(p);

      if (p.analysis) {
        setAnalysis(p.analysis);
        setRequirements(p.analysis.requirements);
      } else {
        // If analyzed but no analysis attached, trigger analyze
        const a = await apiClient.analyzeProject(id);
        setAnalysis(a);
        setRequirements(a.requirements);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load project.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjectAndAnalysis();
  }, [id]);

  const isApprovedOrLocked = project?.status !== 'analyzed' && project?.status !== 'submitted';

  // Debounced API update for requirement edits
  const triggerRecalculation = useCallback((updatedReqs: RequirementItem[]) => {
    if (isApprovedOrLocked || !id) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSaveStatus('saving');

    debounceTimer.current = setTimeout(async () => {
      try {
        const updated = await apiClient.updateProjectAnalysis(id, updatedReqs);
        setAnalysis(updated);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err: any) {
        console.error('Failed to recalculate requirements:', err);
        setSaveStatus('error');
      }
    }, 500);
  }, [id, isApprovedOrLocked]);

  const handleRequirementChange = (index: number, field: keyof RequirementItem, value: any) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements(updated);
    triggerRecalculation(updated);
  };

  const handleAddRequirement = () => {
    if (isApprovedOrLocked) return;
    const nextId = requirements.length > 0 ? Math.max(...requirements.map(r => r.id)) + 1 : 1;
    const newReq: RequirementItem = {
      id: nextId,
      text: 'New functional requirement description',
      type: 'functional',
      priority: 'medium',
      complexity: 'medium',
      integration: false
    };
    const updated = [...requirements, newReq];
    setRequirements(updated);
    triggerRecalculation(updated);
  };

  const handleDeleteRequirement = (index: number) => {
    if (isApprovedOrLocked) return;
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
    triggerRecalculation(updated);
  };

  const handleApprove = async () => {
    if (!id || !approverName.trim()) return;
    setIsApproving(true);
    try {
      const baseline = await apiClient.approveProject(id, approverName.trim(), approvalNotes.trim());
      setAnalysis(baseline);
      setShowApprovalModal(false);
      // Reload project state to update status to approved
      await loadProjectAndAnalysis();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Approval failed.');
    } finally {
      setIsApproving(false);
    }
  };

  const getVerdictBadge = (verdict?: FeasibilityVerdict) => {
    if (verdict === 'feasible') {
      return (
        <span className="badge-feasible text-sm py-1 px-3">
          <CheckCircle2 className="w-4 h-4" />
          Feasible
        </span>
      );
    }
    if (verdict === 'conditional') {
      return (
        <span className="badge-conditional text-sm py-1 px-3">
          <AlertTriangle className="w-4 h-4" />
          Conditional
        </span>
      );
    }
    return (
      <span className="badge-not-feasible text-sm py-1 px-3">
        <XCircle className="w-4 h-4" />
        Not Feasible
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading project analysis and calculations...
      </div>
    );
  }

  if (!project || !analysis) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
        <p className="text-red-600 font-semibold mb-2">Project analysis could not be loaded.</p>
        <button onClick={loadProjectAndAnalysis} className="underline text-teal-700">Retry</button>
      </div>
    );
  }

  const calc = analysis.calculation;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}
      {/* Top Banner & Project Metadata */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400 font-bold">{project.id}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">{project.client}</span>
              {analysis.is_baseline && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Approved Baseline Snapshot
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[#0F1B2D] mt-1">{project.title}</h1>
          </div>

          {/* Verdict Card */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-0.5">Deterministic Verdict</span>
              {getVerdictBadge(calc.verdict)}
            </div>

            {/* Approval Action or Team Button */}
            {!isApprovedOrLocked ? (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Approve Baseline</span>
              </button>
            ) : (
              <button
                onClick={() => navigate(`/projects/${project.id}/team`)}
                className="px-5 py-2.5 bg-[#0F766E] hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Recommend Team</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Written Reasoning */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start space-x-2">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-[#0F1B2D]">Feasibility Rationale: </span>
            {calc.reason}
          </p>
        </div>
      </div>

      {/* Comparison KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Effort vs Deadline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Effort Range</span>
            <span>Target Deadline</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-[#0F1B2D]">
              {calc.min_weeks}–{calc.max_weeks} <span className="text-xs font-normal text-slate-500">weeks</span>
            </div>
            <div className="text-lg font-bold text-slate-700">
              {calc.deadline_weeks} <span className="text-xs font-normal text-slate-400">weeks</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                calc.max_weeks <= calc.deadline_weeks ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (calc.max_weeks / calc.deadline_weeks) * 100)}%` }}
            />
          </div>
        </div>

        {/* Cost vs Budget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Estimated Cost Range</span>
            <span>Budget Ceiling</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-lg font-bold text-[#0F1B2D]">
              {formatINR(calc.min_cost)} – {formatINR(calc.max_cost)}
            </div>
            <div className="text-sm font-semibold text-slate-600">
              {calc.budget_max > 0 ? formatINR(calc.budget_max) : 'Open'}
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                calc.budget_max > 0 && calc.min_cost > calc.budget_max ? 'bg-red-500' : 'bg-teal-600'
              }`}
              style={{
                width: calc.budget_max > 0 ? `${Math.min(100, (calc.max_cost / calc.budget_max) * 100)}%` : '50%'
              }}
            />
          </div>
        </div>

        {/* Historical Learning Adjustment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Historical Learning</span>
            <span>Completed Projects</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-teal-800">
              {calc.historical_adjustment_applied ? `+${calc.historical_overrun_pct}%` : 'Baseline'}
            </div>
            <div className="text-sm font-bold text-slate-600">
              {calc.historical_project_count} projects
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            {calc.historical_adjustment_applied
              ? `Future estimate buffered by empirical average overrun across past projects.`
              : `Standard baseline buffer applied (1.15 min – 1.50 max).`}
          </p>
        </div>
      </div>

      {/* Editable Requirements Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#0F1B2D] flex items-center space-x-2">
              <span>Project Requirements Matrix</span>
              {isApprovedOrLocked ? (
                <span className="text-[11px] font-normal text-slate-500 flex items-center">
                  <Lock className="w-3 h-3 mr-1 text-slate-400" /> Locked Baseline
                </span>
              ) : (
                <span className="text-[11px] font-normal text-teal-700">
                  (Editable: manager adjustments auto-recalculate feasibility)
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Auto-save Indicator */}
            {saveStatus === 'saving' && (
              <span className="text-xs text-amber-600 flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping mr-1.5" />
                Recalculating...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-emerald-600 flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" />
                Saved & Recalculated
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-600 flex items-center">
                Recalculation error
              </span>
            )}

            {!isApprovedOrLocked && (
              <button
                onClick={handleAddRequirement}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Requirement</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4">Requirement Specification</th>
                <th className="py-3 px-3 w-32">Type</th>
                <th className="py-3 px-3 w-28">Priority</th>
                <th className="py-3 px-3 w-28">Complexity</th>
                <th className="py-3 px-3 w-24 text-center">Integration</th>
                {!isApprovedOrLocked && <th className="py-3 px-3 w-16 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requirements.map((req, index) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                    {req.id}
                  </td>
                  <td className="py-3 px-4">
                    {isApprovedOrLocked ? (
                      <span className="text-slate-800 font-medium">{req.text}</span>
                    ) : (
                      <input
                        type="text"
                        value={req.text}
                        onChange={(e) => handleRequirementChange(index, 'text', e.target.value)}
                        className="w-full px-2 py-1 border border-transparent hover:border-slate-300 focus:border-teal-500 rounded text-xs text-slate-800 focus:outline-none"
                      />
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {isApprovedOrLocked ? (
                      <span className="text-slate-600 capitalize">{req.type.replace('_', ' ')}</span>
                    ) : (
                      <select
                        value={req.type}
                        onChange={(e) => handleRequirementChange(index, 'type', e.target.value as RequirementType)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none"
                      >
                        <option value="functional">Functional</option>
                        <option value="non_functional">Non-Functional</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {isApprovedOrLocked ? (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                        req.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.priority}
                      </span>
                    ) : (
                      <select
                        value={req.priority}
                        onChange={(e) => handleRequirementChange(index, 'priority', e.target.value as PriorityLevel)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {isApprovedOrLocked ? (
                      <span className="font-semibold text-slate-700 capitalize">{req.complexity}</span>
                    ) : (
                      <select
                        value={req.complexity}
                        onChange={(e) => handleRequirementChange(index, 'complexity', e.target.value as ComplexityLevel)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none font-semibold"
                      >
                        <option value="low">Low (1pt)</option>
                        <option value="medium">Medium (3pt)</option>
                        <option value="high">High (5pt)</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {isApprovedOrLocked ? (
                      req.integration ? <span className="font-bold text-teal-700">Yes (+1.5w)</span> : <span className="text-slate-400">No</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={req.integration}
                        onChange={(e) => handleRequirementChange(index, 'integration', e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                      />
                    )}
                  </td>
                  {!isApprovedOrLocked && (
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRequirement(index)}
                        title="Delete requirement"
                        className="text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Calculation Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <button
          onClick={() => setShowCalcDetails(!showCalcDetails)}
          className="w-full flex items-center justify-between text-left text-xs font-bold text-[#0F1B2D]"
        >
          <span className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-teal-700" />
            <span>Deterministic Calculation Breakdown & Audit Trail</span>
          </span>
          {showCalcDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showCalcDetails && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs space-y-3 font-mono text-slate-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <span className="text-slate-400 block text-[11px]">Total Points:</span>
                <span className="text-base font-bold text-slate-800">{calc.total_points} pts</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Integration Overhead:</span>
                <span className="text-base font-bold text-slate-800">{calc.integration_overhead} person-wks</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assumed Team Capacity:</span>
                <span className="text-base font-bold text-slate-800">{calc.effective_developers} devs (3 @ 80%)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Weekly Rate:</span>
                <span className="text-base font-bold text-slate-800">{formatINR(calc.rate_per_week)}/wk</span>
              </div>
            </div>
            <p className="text-[11px] font-sans text-slate-500">
              Formula: <code className="bg-slate-100 px-1 py-0.5 rounded">person_weeks = (points × 0.5) + (integrations × 1.5)</code> | <code className="bg-slate-100 px-1 py-0.5 rounded">calendar_weeks = person_weeks / 2.4</code> | <code className="bg-slate-100 px-1 py-0.5 rounded">min = ceil(weeks × 1.15)</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">max = ceil(weeks × 1.50)</code>.
            </p>
          </div>
        )}
      </div>

      {/* Risks, Gaps, Conflicts & Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Identified Risks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-[#0F1B2D] flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Identified Risks & Suggested Mitigations</span>
          </h3>
          <div className="space-y-2">
            {analysis.risks.map((risk, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{risk.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    risk.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {risk.severity}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gaps & Conflicts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-[#0F1B2D] flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Requirements Gaps & Conflicts</span>
          </h3>
          <div className="space-y-2">
            {analysis.gaps.map((gap, i) => (
              <div key={i} className="p-3 bg-red-50/60 border border-red-200 rounded-lg text-xs flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-red-900 block">Gap:</span>
                  <span className="text-red-800">{gap}</span>
                </div>
                <button
                  onClick={() => setResolvedItems(prev => ({ ...prev, [`gap-${i}`]: !prev[`gap-${i}`] }))}
                  className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 ${
                    resolvedItems[`gap-${i}`] ? 'bg-emerald-600 text-white' : 'bg-white border border-red-300 text-red-800'
                  }`}
                >
                  {resolvedItems[`gap-${i}`] ? 'Resolved' : 'Mark Resolved'}
                </button>
              </div>
            ))}
            {analysis.conflicts.map((conf, i) => (
              <div key={i} className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-amber-900 block">Conflict:</span>
                  <span className="text-amber-800">{conf}</span>
                </div>
                <button
                  onClick={() => setResolvedItems(prev => ({ ...prev, [`conf-${i}`]: !prev[`conf-${i}`] }))}
                  className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 ${
                    resolvedItems[`conf-${i}`] ? 'bg-emerald-600 text-white' : 'bg-white border border-amber-300 text-amber-800'
                  }`}
                >
                  {resolvedItems[`conf-${i}`] ? 'Resolved' : 'Mark Resolved'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills and Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Required Skills */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-[#0F1B2D]">Required Skills & Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.required_skills.map((skill, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  skill.mandatory
                    ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {skill.name} {skill.mandatory && '★'}
              </span>
            ))}
          </div>
          <div className="pt-2 text-xs text-slate-400">
            Tech stack: {analysis.tech_stack.join(', ')}
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-[#0F1B2D]">Recommended Milestone Delivery Schedule</h3>
          <div className="space-y-2">
            {analysis.milestones.map((ms, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-medium text-slate-800">{ms.name}</span>
                <span className="font-mono font-bold text-[#0F766E]">{ms.weeks} weeks</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-[#0F1B2D]">Approve Baseline & Lock Analysis</h3>
            <p className="text-xs text-slate-500">
              Freezing the baseline preserves an immutable snapshot of all requirements, effort, and cost estimates.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Manager / Approver Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra (Delivery Manager)"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approval Notes & Signoff Governance (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Approved baseline for engineering team allocation..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                disabled={isApproving}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving || !approverName.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isApproving ? 'Freezing Baseline...' : 'Confirm & Freeze Baseline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
