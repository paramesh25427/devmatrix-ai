import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProjectIntakeForm } from './components/ProjectIntakeForm';
import { FeasibilityDashboard } from './components/FeasibilityDashboard';
import { EvidenceModal } from './components/EvidenceModal';
import type { ProjectCreate, ProjectResponse, FeasibilityReportResponse, RiskItemResponse } from './types/api';
import { createProject, runFeasibilityAnalysis, getLatestFeasibilityReport, getProject } from './services/api';
import { FALLBACK_MOCK_PROJECT, FALLBACK_MOCK_REPORT } from './services/mockData';
import axios from 'axios';

export function App() {
  const [activeView, setActiveView] = useState<'intake' | 'report'>('intake');
  const [currentProject, setCurrentProject] = useState<ProjectResponse | null>(null);
  const [report, setReport] = useState<FeasibilityReportResponse | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskItemResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(true);
  const [isMockData, setIsMockData] = useState<boolean>(false);

  // Healthcheck on load
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await axios.get('http://localhost:8000/health', { timeout: 3000 });
        if (res.data?.status === 'ok') {
          setIsLiveBackend(true);
        }
      } catch (e) {
        console.warn('Backend /health unreachable at startup. Setting offline fallback readiness.');
        setIsLiveBackend(false);
      }
    }
    checkHealth();
  }, []);

  // Handle Project Intake Form Submit
  const handleIntakeSubmit = async (formData: ProjectCreate) => {
    setIsLoading(true);
    setError(null);
    try {
      let createdProject: ProjectResponse;
      try {
        const res = await createProject(formData);
        createdProject = res.data;
        setIsMockData(false);
      } catch (err: any) {
        console.warn('Backend unavailable, using synthetic demo project response:', err.message);
        createdProject = {
          ...FALLBACK_MOCK_PROJECT,
          ...formData,
          project_id: `PRJ-${Math.floor(100 + Math.random() * 900)}`
        };
        setIsMockData(true);
      }

      setCurrentProject(createdProject);

      // Now run feasibility analysis on the created project
      setIsAnalyzing(true);
      let analysisReport: FeasibilityReportResponse;
      try {
        const analysisRes = await runFeasibilityAnalysis(createdProject.project_id);
        analysisReport = analysisRes.data;
        setIsMockData(false);
      } catch (err: any) {
        console.warn('Backend analysis unavailable, using synthetic demo report response:', err.message);
        analysisReport = {
          ...FALLBACK_MOCK_REPORT,
          project_id: createdProject.project_id
        };
        setIsMockData(true);
      }

      setReport(analysisReport);
      setActiveView('report');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create and evaluate project.');
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  // Inspect Seed Reference Project PRJ-101
  const handleInspectReference = async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let prj: ProjectResponse;
      let rep: FeasibilityReportResponse;

      try {
        // Try fetching live project PRJ-101 from FastAPI
        const prjRes = await getProject(projectId);
        prj = prjRes.data;

        // Run or fetch latest analysis report
        try {
          const repRes = await getLatestFeasibilityReport(projectId);
          rep = repRes.data;
        } catch {
          const repRes = await runFeasibilityAnalysis(projectId);
          rep = repRes.data;
        }
        setIsMockData(false);
      } catch (err: any) {
        console.warn('Could not fetch live reference project, using offline ShopNova demo data:', err.message);
        prj = FALLBACK_MOCK_PROJECT;
        rep = FALLBACK_MOCK_REPORT;
        setIsMockData(true);
      }

      setCurrentProject(prj);
      setReport(rep);
      setActiveView('report');
    } catch (err: any) {
      setError(`Failed to inspect reference project: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run Analysis on current project
  const handleReanalyze = async () => {
    if (!currentProject) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      try {
        const res = await runFeasibilityAnalysis(currentProject.project_id);
        setReport(res.data);
        setIsMockData(false);
      } catch (err: any) {
        console.warn('Re-analysis failed on backend, retaining previous report:', err.message);
        setIsMockData(true);
      }
    } catch (err: any) {
      setError(`Re-analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        isLive={isLiveBackend}
        activeView={activeView}
        setActiveView={setActiveView}
        currentProjectId={currentProject?.project_id}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'intake' && (
          <ProjectIntakeForm
            onSubmit={handleIntakeSubmit}
            onInspectReferenceProject={handleInspectReference}
            isLoading={isLoading}
            error={error}
          />
        )}

        {activeView === 'report' && (
          <>
            {report ? (
              <FeasibilityDashboard
                report={report}
                onReanalyze={handleReanalyze}
                onInspectRisk={(risk) => setSelectedRisk(risk)}
                isAnalyzing={isAnalyzing}
                isMockData={isMockData}
              />
            ) : (
              <div id="no-report-placeholder" className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                  !
                </div>
                <h3 className="text-lg font-bold text-white">No Feasibility Report Loaded</h3>
                <p className="text-xs text-slate-400">
                  Please submit a project intake form or inspect the pre-seeded ShopNova reference project.
                </p>
                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={() => setActiveView('intake')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Go to Intake Form
                  </button>
                  <button
                    onClick={() => handleInspectReference('PRJ-101')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Load ShopNova PRJ-101
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Evidence Provenance Modal / Drawer */}
      <EvidenceModal
        risk={selectedRisk}
        onClose={() => setSelectedRisk(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DevMatrix AI Â· 48-Hour Hackathon Vertical Slice</span>
          <span className="font-mono text-[11px] text-slate-600">Deterministic Risk Engine v1.0.0 Â· Tenant: ORG-001</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
