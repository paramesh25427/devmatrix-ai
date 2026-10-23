import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ShieldAlert, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';
import { apiClient } from '../api/client';
import type { TeamRecommendationResponse, ProjectDetailResponse } from '../types/contract';

export function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [recommendation, setRecommendation] = useState<TeamRecommendationResponse | null>(null);
  const [selectedTeamOption, setSelectedTeamOption] = useState<'best' | 'alternative'>('best');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const p = await apiClient.getProject(id);
      setProject(p);

      if (p.status === 'submitted' || p.status === 'analyzed') {
        setError("Team allocation is strictly locked until a manager reviews and approves the project baseline.");
        setIsLoading(false);
        return;
      }

      const rec = await apiClient.getTeamRecommendation(id);
      setRecommendation(rec);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load team recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleConfirmTeam = async () => {
    if (!id) return;
    setIsConfirming(true);
    try {
      await apiClient.confirmTeam(id, selectedTeamOption);
      navigate(`/projects/${id}/delivery`);
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Team confirmation failed.');
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Running deterministic team optimization algorithms...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-base font-bold text-[#0F1B2D]">Action Required</h2>
        <p className="text-xs text-slate-600">{error}</p>
        <button
          onClick={() => navigate(`/projects/${id}/review`)}
          className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-xs font-semibold hover:bg-teal-700"
        >
          Go to Review Page
        </button>
      </div>
    );
  }

  if (!recommendation) return null;

  const currentTeam = selectedTeamOption === 'best' ? recommendation.best_team : recommendation.alternative.team;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/projects/${id}/review`)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Review
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 font-bold">{project?.id}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">{project?.client}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1B2D] mt-1">Engineering Team Recommendation</h1>
        </div>

        <button
          onClick={handleConfirmTeam}
          disabled={isConfirming}
          className="px-6 py-2.5 bg-[#0F766E] hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          <span>{isConfirming ? 'Confirming Squad...' : 'Confirm Team & Launch Delivery'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Coverage & Optimization Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Mandatory Skill Coverage
          </span>
          <div className="text-2xl font-bold text-emerald-600">
            {recommendation.coverage_pct}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {recommendation.mandatory_skills_covered} of {recommendation.total_mandatory_skills} mandatory skills matched.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Capacity Constraint Status
          </span>
          <div className="text-2xl font-bold text-[#0F1B2D]">
            {recommendation.capacity_violations.length === 0 ? '100% Compliant' : 'Violations Detected'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero members allocated above individual free capacity.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
            Active Squad Size
          </span>
          <div className="text-2xl font-bold text-[#0F766E]">
            {currentTeam.length} Engineers
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Optimized within the 3–5 member bounded team constraint.
          </p>
        </div>
      </div>

      {/* Team Selection Tabs: Best vs Alternative */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700">Team Configuration:</span>
            <button
              onClick={() => setSelectedTeamOption('best')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedTeamOption === 'best'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Recommended Primary Squad
            </button>
            <button
              onClick={() => setSelectedTeamOption('alternative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedTeamOption === 'alternative'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Alternative Squad
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Option: <span className="font-bold text-[#0F1B2D] uppercase">{selectedTeamOption}</span>
          </span>
        </div>

        {/* Tradeoff Explanation */}
        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-700 flex items-start space-x-2">
          <Award className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold text-[#0F1B2D]">Trade-off Rationale: </span>
            {selectedTeamOption === 'best'
              ? recommendation.explanation
              : recommendation.alternative.tradeoff}
          </p>
        </div>

        {recommendation.uncovered_skills.length > 0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Uncovered Skills Warning: </strong>
              The following skills could not be covered in-house: {recommendation.uncovered_skills.join(', ')}. Contractor onboarding advised.
            </span>
          </div>
        )}
      </div>

      {/* Team Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentTeam.map((member) => (
          <div
            key={member.developer_id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-teal-500 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 font-bold">{member.developer_id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {member.allocated_capacity_pct}% Allocated
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0F1B2D] mt-1">{member.name}</h3>
              <p className="text-xs font-medium text-teal-700">{member.role}</p>

              {/* Skills Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(member.skills).map(([skill, level]) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700 font-medium"
                  >
                    {skill} <span className="text-teal-700 font-bold">L{level}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-tight">
              {member.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
