import { useState, useEffect } from 'react';
import { Flag, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import type { DeveloperProfile } from '../types/contract';

export function DevelopersPage() {
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flaggingDev, setFlaggingDev] = useState<DeveloperProfile | null>(null);
  const [flagNote, setFlagNote] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDevelopers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getDevelopers();
      setDevelopers(data);
    } catch (err) {
      console.error('Failed to load developers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const handleSaveFlag = async () => {
    if (!flaggingDev || !flagNote.trim()) return;
    try {
      await apiClient.flagDeveloper(flaggingDev.id, flagNote.trim());
      setSuccessMsg(`Skill correction note successfully recorded for ${flaggingDev.name}.`);
      setFlaggingDev(null);
      setFlagNote('');
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchDevelopers();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to save skill correction.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Developer Profiles & Skill Governance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fictional internal engineering roster, proficiency matrix, available weekly capacity, and governance flags.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-teal-800">{developers.length} Verified Developers</span>
          <span className="text-[11px] text-slate-400 block">Strictly fictional synthetic roster</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading developer roster...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-400 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 font-bold">{dev.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dev.free_capacity_pct >= 50
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : dev.free_capacity_pct >= 20
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {dev.free_capacity_pct}% Free Capacity
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#0F1B2D] mt-1">{dev.name}</h3>
                <p className="text-xs font-medium text-teal-700">{dev.role} · {dev.experience_years} yrs exp</p>

                {/* Skills */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(dev.skills).map(([skill, level]) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700 font-medium"
                    >
                      {skill} <span className="text-teal-700 font-bold">L{level}</span>
                    </span>
                  ))}
                </div>

                {/* Flagged Skills */}
                {dev.flagged_skills && dev.flagged_skills.length > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 space-y-1">
                    <span className="font-bold flex items-center">
                      <Flag className="w-3 h-3 mr-1 text-amber-600" />
                      Correction Flags:
                    </span>
                    {dev.flagged_skills.map((note, idx) => (
                      <p key={idx} className="text-[10px] text-amber-900">• {note}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Governance</span>
                <button
                  onClick={() => {
                    setFlaggingDev(dev);
                    setFlagNote('');
                  }}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Flag Skill Correction</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flag Skill Modal */}
      {flaggingDev && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-[#0F1B2D]">Flag Skill Correction Note</h3>
            <p className="text-xs text-slate-600">
              Record a governance note regarding skills or capacity for <strong>{flaggingDev.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correction / Verification Note
              </label>
              <textarea
                rows={3}
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="e.g. Completed advanced PostgreSQL optimization certification; proficiency level should be reviewed to Level 5."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setFlaggingDev(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFlag}
                disabled={!flagNote.trim()}
                className="px-4 py-1.5 bg-[#0F766E] hover:bg-teal-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Save Correction Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
