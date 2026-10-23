import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { NewProjectPage } from './pages/NewProjectPage';
import { ReviewPage } from './pages/ReviewPage';
import { TeamPage } from './pages/TeamPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { DevelopersPage } from './pages/DevelopersPage';
import { apiClient } from './api/client';

export function App() {
  const [isBackendLive, setIsBackendLive] = useState<boolean>(true);

  useEffect(() => {
    async function checkHealth() {
      const res = await apiClient.getHealth();
      setIsBackendLive(res.status === 'ok');
    }
    checkHealth();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
        {/* Navigation Bar */}
        <Navbar isBackendLive={isBackendLive} />

        {/* Core Page Router */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects/new" element={<NewProjectPage />} />
            <Route path="/projects/:id/review" element={<ReviewPage />} />
            <Route path="/projects/:id/team" element={<TeamPage />} />
            <Route path="/projects/:id/delivery" element={<DeliveryPage />} />
            <Route path="/developers" element={<DevelopersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>DevMatrix AI · AI-Assisted Software Project Feasibility & Delivery Platform</span>
            <span className="font-mono text-[11px] text-slate-400">Viksitthon 2026 Edition · Deterministic Rules Engine v1.0.0</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
