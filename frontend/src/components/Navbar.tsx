import type { FC } from 'react';
import { Cpu, Building2, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  isLive: boolean;
  activeView: 'intake' | 'report';
  setActiveView: (view: 'intake' | 'report') => void;
  currentProjectId?: string;
}

export const Navbar: FC<NavbarProps> = ({
  isLive,
  activeView,
  setActiveView,
  currentProjectId
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('intake')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">DevMatrix</span>
              <span className="text-xs px-1.5 py-0.5 font-semibold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Organization-Aware Feasibility & Risk Intelligence</p>
          </div>
        </div>

        {/* Center Navigation */}
        <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-800 p-1 rounded-lg">
          <button
            id="nav-intake-btn"
            onClick={() => setActiveView('intake')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'intake'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Project Intake
          </button>
          <button
            id="nav-report-btn"
            onClick={() => setActiveView('report')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'report'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Feasibility Report {currentProjectId ? `(${currentProjectId})` : ''}
          </button>
        </div>

        {/* Right Status */}
        <div className="flex items-center space-x-3">
          {/* Org context */}
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium text-slate-200">ShopNova Retail</span>
            <span className="text-slate-500 font-mono text-[11px]">ORG-001</span>
          </div>

          {/* Connection status */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isLive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {isLive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="w-3 h-3" />
                <span>FastAPI Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Offline Fallback</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
