import type { FC } from 'react';
import { X, Database, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { RiskItemResponse } from '../types/api';

interface EvidenceModalProps {
  risk: RiskItemResponse | null;
  onClose: () => void;
}

export const EvidenceModal: FC<EvidenceModalProps> = ({ risk, onClose }) => {
  if (!risk) return null;

  const { evidence_provenance: ev } = risk;

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="evidence-modal-card"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-indigo-950/50 p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${getSeverityBadge(risk.severity)}`}>
                {risk.severity} Severity
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                {risk.risk_rule_id || risk.risk_id}
              </span>
              <span className="text-xs text-indigo-400 font-medium capitalize">
                {risk.dimension.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{risk.title}</h3>
          </div>
          <button
            id="close-evidence-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-5 space-y-6">
          {/* Finding Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Finding Summary</span>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
              {risk.description}
            </p>
          </div>

          {/* Verifiable Evidence Provenance Card */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Verifiable Empirical Evidence</span>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 border border-emerald-500/20 shadow-inner space-y-3">
              {/* Evidence Key Value Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Record Type</span>
                  <span className="font-mono text-slate-300 font-semibold">{ev.record_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Record ID</span>
                  <span className="font-mono text-indigo-400 font-semibold">{ev.record_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Observed Value</span>
                  <span className="font-mono text-amber-400 font-bold">{String(ev.observed_value)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Required Value</span>
                  <span className="font-mono text-emerald-400 font-bold">{String(ev.required_value)}</span>
                </div>
              </div>

              {/* Exact Citation */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-1">Direct Persistence Citation:</span>
                <blockquote className="text-xs italic text-slate-200 border-l-2 border-emerald-500 pl-3 py-1 bg-emerald-950/20 rounded-r">
                  "{ev.citation}"
                </blockquote>
              </div>
            </div>
          </div>

          {/* Impact & Mitigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Potential Project Impact</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {risk.potential_impact}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Recommended Mitigation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {risk.suggested_mitigation}
              </p>
            </div>
          </div>

          {/* Governance & Ownership */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Assigned Governance Role: <strong className="text-white">{risk.owner_role}</strong></span>
            </div>
            {risk.affected_requirement_id && (
              <span className="text-slate-400 font-mono">
                Affects: <strong className="text-indigo-300">{risk.affected_requirement_id}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            id="dismiss-evidence-modal-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Provenance View
          </button>
        </div>
      </div>
    </div>
  );
};
