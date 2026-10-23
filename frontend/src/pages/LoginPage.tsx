import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  ShieldCheck,
  Cpu,
  Users,
  LineChart,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export function LoginPage() {
  const { loginWithGoogle, loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'Delivery Manager' | 'Technical Lead' | 'Executive Reviewer'>('Delivery Manager');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Initialize Google Identity Services if client ID is provided
  useEffect(() => {
    let interval: any = null;

    const initGsi = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id && googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (response.credential) {
                setError(null);
                setIsSubmitting(true);
                try {
                  await loginWithGoogle(response.credential, role);
                  navigate('/');
                } catch (err: any) {
                  setError(err.response?.data?.message || 'Google authentication failed. Please try again.');
                } finally {
                  setIsSubmitting(false);
                }
              }
            },
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              width: 320,
              shape: 'rectangular',
              text: mode === 'signup' ? 'signup_with' : 'signin_with',
            });
          }
          if (interval) clearInterval(interval);
          return true;
        } catch (err) {
          console.warn('Google Identity initialization error:', err);
        }
      }
      return false;
    };

    const ready = initGsi();
    if (!ready) {
      interval = setInterval(() => {
        if (initGsi()) {
          clearInterval(interval);
        }
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [googleClientId, mode, role, loginWithGoogle, navigate]);

  const handleCustomGoogleClick = async () => {
    setError(null);
    if (!googleClientId) {
      setError(
        'Google Client ID is not configured in VITE_GOOGLE_CLIENT_ID. You can use the One-Click Demo Login below to test the full application immediately!'
      );
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginDemo(role);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Demo authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 my-2">
      {/* Left Brand Showcase Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F1B2D] text-white p-10 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative glowing background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Logo & Platform Tag */}
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-lg shadow-teal-900/40">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-white">DevMatrix AI</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800">
                  Viksitthon 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">Project Commander & Feasibility Platform</p>
            </div>
          </div>

          {/* Value Prop Headline */}
          <div className="space-y-3 mb-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-teal-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Extraction · Pure Python Deterministic Rules</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-snug text-white">
              Enterprise Project Governance & Team Intelligence
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Convert raw client requirements into auditable, deterministic project assessments. Lock verified baselines, optimize squad capacity, and prevent delivery overruns.
            </p>
          </div>

          {/* Pillars List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-teal-950/70 border border-teal-800/60 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Deterministic Rules Engine</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Strictly isolated effort and cost calculations (0.5 wk/pt, ₹25k/wk). The AI never decides feasibility verdicts.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-teal-950/70 border border-teal-800/60 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Capacity-Constrained Optimizer</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Automated squad allocation enforcing skill match scores and 20% minimum free bandwidth constraints.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-teal-950/70 border border-teal-800/60 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <LineChart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Empirical Closed-Loop Learning</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Past completed project outcomes continuously calibrate future estimation buffer multipliers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Governance Footer */}
        <div className="relative z-10 pt-8 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Role-Based Governance</span>
          </div>
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-teal-400" />
            <span>Auditable Baselines</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">v1.0.0</span>
        </div>
      </div>

      {/* Right Authentication Card */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-between p-8 sm:p-12">
        <div className="max-w-md w-full mx-auto">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {mode === 'signin' ? 'Sign in to DevMatrix' : 'Create your account'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'signin'
                  ? 'Access your organization feasibility & delivery workspace'
                  : 'Get started as a verified project delivery manager'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Your Organizational Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Delivery Manager', 'Technical Lead', 'Executive Reviewer'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition-all ${
                    role === r
                      ? 'border-teal-600 bg-teal-50/80 text-teal-800 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Google Sign-In Area */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Federated Identity
            </label>

            {/* Rendered Google GSI button container */}
            <div ref={googleBtnRef} className="flex justify-center min-h-[44px]">
              {/* Fallback custom button if GSI has not rendered yet or in custom mode */}
              <button
                type="button"
                onClick={handleCustomGoogleClick}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 border border-slate-300 rounded-lg shadow-xs bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Authenticates securely with Google Identity Services. No password stored.
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span className="bg-white px-3">Instant Demo Evaluation</span>
            </div>
          </div>

          {/* One-Click Demo Login */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0F766E] hover:bg-teal-700 text-white font-medium text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>Instant Delivery Manager Access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Preloaded credentials: <strong>Alex Morgan</strong> (Senior Delivery Manager)</span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="text-center pt-6 mt-6 border-t border-slate-100 text-[11px] text-slate-400">
          By signing in, you agree to the DevMatrix AI Governance Charter and Viksitthon 2026 Audit Standard.
        </div>
      </div>
    </div>
  );
}
