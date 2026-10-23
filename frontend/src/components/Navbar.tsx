import { Link, useLocation } from 'react-router-dom';
import { Layers, PlusCircle, Users, Activity, AlertCircle } from 'lucide-react';

interface NavbarProps {
  isBackendLive?: boolean;
}

export function Navbar({ isBackendLive = true }: NavbarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0F1B2D] border-b border-slate-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center space-x-3 text-white no-underline group">
            <div className="w-9 h-9 rounded-lg bg-[#0F766E] flex items-center justify-center text-white shadow-sm group-hover:bg-teal-500 transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">DevMatrix AI</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800">
                  Viksitthon 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Feasibility, Team Optimizer & Delivery</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/')
                  ? 'bg-slate-800 text-teal-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Projects Dashboard</span>
            </Link>

            <Link
              to="/projects/new"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/projects/new')
                  ? 'bg-[#0F766E] text-white font-semibold'
                  : 'bg-teal-800/40 text-teal-300 hover:bg-[#0F766E] hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Project</span>
            </Link>

            <Link
              to="/developers"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                isActive('/developers')
                  ? 'bg-slate-800 text-teal-400 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Developers</span>
            </Link>

            {/* Live Status indicator */}
            <div className="ml-3 pl-3 border-l border-slate-700 flex items-center space-x-1.5">
              {isBackendLive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  FastAPI Live
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950 text-amber-400 border border-amber-800/60">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Mock / Standalone
                </span>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
