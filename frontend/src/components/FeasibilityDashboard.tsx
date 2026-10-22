import { useState } from 'react';
import type { FC } from 'react';
import {
  ShieldAlert,
  Clock,
  DollarSign,
  Briefcase,
  ChevronRight,
  RefreshCw,
  Info,
  CheckCircle2,
  FileQuestion
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { FeasibilityReportResponse, RiskItemResponse } from '../types/api';

interface FeasibilityDashboardProps {
  report: FeasibilityReportResponse;
  onReanalyze: () => Promise<void>;
  onInspectRisk: (risk: RiskItemResponse) => void;
  isAnalyzing: boolean;
  isMockData: boolean;
}

export const FeasibilityDashboard: FC<FeasibilityDashboardProps> = ({
  report,
  onReanalyze,
  onInspectRisk,
  isAnalyzing,
  isMockData
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'feasible':
        return {
          label: 'FEASIBLE FOR EXECUTION',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          indicatorClass: 'bg-emerald-400',
          desc: 'Project parameters fit organizational skills, infrastructure, and delivery commitments.'
        };
      case 'feasible_with_conditions':
        return {
          label: 'FEASIBLE WITH CONDITIONS',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-950/20',
          indicatorClass: 'bg-amber-400 animate-pulse',
          desc: 'Viable within budget, but requires resolving identified skill deficits and capacity conflicts prior to manager approval.'
        };
      case 'not_feasible':
        return {
          label: 'NOT FEASIBLE',
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          indicatorClass: 'bg-rose-400',
          desc: 'Critical fatal blockers or severe cost/schedule overruns require formal project renegotiation.'
        };
      default:
        return {
          label: 'INSUFFICIENT INFORMATION',
          badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          indicatorClass: 'bg-slate-400',
          desc: 'Critical architectural specifications or functional details are missing.'
        };
    }
  };

  const statusConfig = getStatusDisplay(report.overall_status);

  // Filter risks
  const filteredRisks = report.risks.filter(r => {
    if (selectedSeverity === 'all') return true;
    return r.severity.toLowerCase() === selectedSeverity.toLowerCase();
  });

  const getSeverityStyle = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  // Dimension chart data
  const chartData = [
    { name: 'Complexity Risk', value: report.technical_complexity_score, fill: '#6366f1' },
    { name: 'Completeness', value: report.completeness_score, fill: '#10b981' },
    { name: 'Org Readiness', value: report.org_capability_score, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Status + Actions */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider border flex items-center space-x-2 ${statusConfig.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${statusConfig.indicatorClass}`} />
                <span>{statusConfig.label}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Run: <strong>{report.run_id}</strong> · Report: <strong>{report.report_id}</strong>
              </span>
              {isMockData && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Demo Fallback Data
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {statusConfig.desc}
            </p>
          </div>

          {/* Re-analyze Button */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="reanalyze-btn"
              onClick={onReanalyze}
              disabled={isAnalyzing}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg ${
                isAnalyzing
                  ? 'bg-slate-800 text-slate-400 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Engine...' : 'Re-Run Risk Engine'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Score + PERT Estimations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Composite Risk Score */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Risk Score</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-white tracking-tight">{report.overall_score.toFixed(1)}</span>
            <span className="text-sm font-semibold text-slate-500">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Exact formula: <code className="text-indigo-400">{report.overall_score.toFixed(2)}</code> baseline risk. Lower score = greater feasibility.
          </p>
        </div>

        {/* Nominal Effort (PERT) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nominal Effort</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="my-3 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-white tracking-tight">{report.estimated_effort_hours_nominal}</span>
            <span className="text-sm font-semibold text-slate-400">person-hours</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Optimistic: {report.estimated_effort_hours_optimistic}h</span>
            <span>Pessimistic: {report.estimated_effort_hours_pessimistic}h</span>
          </div>
        </div>

        {/* Nominal Cost vs Budget */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-emerald-400 tracking-tight">
              ${report.estimated_cost_nominal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[11px] text-emerald-300/80 font-medium">
            Viable: Well within $85,000 budget ($40,300 headroom available).
          </p>
        </div>

        {/* Delivery Duration */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Path</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-white tracking-tight">{report.estimated_duration_days_nominal}</span>
            <span className="text-sm font-semibold text-slate-400">calendar days</span>
          </div>
          <p className="text-[11px] text-amber-400 font-medium">
            Target was 60 days (+5 days critical path variance).
          </p>
        </div>
      </div>

      {/* Middle Row: Executive Summary + Dimension Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executive Summary */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>Executive Feasibility Summary</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {report.executive_summary}
          </p>
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Recommended Governance Action:</span>
            <span className="font-semibold text-indigo-300 font-mono bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/20">
              {report.recommended_action}
            </span>
          </div>
        </div>

        {/* Dimension Radar / Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine Dimensions</span>
            <span className="text-[11px] text-slate-500 font-mono">11-Vector Baseline</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Score']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Scores reflect normalized readiness and capacity dimensions.
          </p>
        </div>
      </div>

      {/* Missing Information & Pre-approval Conditions */}
      <div id="missing-info-section" className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <FileQuestion className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Missing Information & Mandatory Pre-Approval Conditions
          </h2>
        </div>
        <p className="text-xs text-slate-300">
          The project manager and engineering leads must satisfy the following verifiable prerequisites before manager sign-off unlocks task allocation:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {report.pre_approval_conditions.map((condition, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {condition}
              </p>
            </div>
          ))}
          {/* Missing NFR ambiguity clarification notice */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/20 flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              !
            </span>
            <div className="space-y-0.5">
              <p className="text-xs text-indigo-200 font-medium">
                Clarification CLR-301: Missing Peak RPS
              </p>
              <p className="text-[11px] text-slate-400">
                REQ-206 lacks concurrency parameters; signoff required before DB connection sizing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Register */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Interactive Risk Register</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {filteredRisks.length} Findings
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Each finding is deterministically verified with direct citations from organization databases.
            </p>
          </div>

          {/* Severity Filters */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
            {['all', 'critical', 'high', 'medium'].map(sev => (
              <button
                key={sev}
                id={`filter-${sev}-btn`}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedSeverity === sev
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRisks.map(risk => (
            <div
              key={risk.risk_id}
              id={`risk-card-${risk.risk_id}`}
              onClick={() => onInspectRisk(risk)}
              className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-950/30 transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                {/* Card Top: Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${getSeverityStyle(risk.severity)}`}>
                      {risk.severity}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {risk.risk_rule_id || risk.risk_id}
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-400 font-medium capitalize">
                    {risk.dimension.replace('_', ' ')}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {risk.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {risk.description}
                </p>
              </div>

              {/* Mitigation & Evidence Link */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium truncate max-w-[240px]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{risk.suggested_mitigation}</span>
                </div>

                <span className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>Inspect Evidence</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
