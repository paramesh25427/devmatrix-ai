import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layers, PlusCircle, Users, Activity, AlertCircle, LogOut, LogIn, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  isBackendLive?: boolean;
}

export function Navbar({ isBackendLive = true }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
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
            <div className="ml-2 pl-2 border-l border-slate-700 hidden sm:flex items-center space-x-1.5">
              {isBackendLive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  FastAPI Live
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950 text-amber-400 border border-amber-800/60">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Mock
                </span>
              )}
            </div>

            {/* User Profile / Auth State */}
            <div className="ml-3 pl-3 border-l border-slate-700 relative">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 text-left focus:outline-hidden p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border border-teal-500/50 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-900 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-700">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden md:block">
                      <div className="text-xs font-semibold text-white leading-tight flex items-center space-x-1">
                        <span>{user.name}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <div className="text-[10px] text-teal-400 font-mono leading-none">
                        {user.role}
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-2 z-50 text-xs"
                      onMouseLeave={() => setDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-800">
                        <p className="font-semibold text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className="mt-1 inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800">
                          {user.role}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-rose-300 hover:bg-slate-800 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0F766E] hover:bg-teal-600 text-white shadow-xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
