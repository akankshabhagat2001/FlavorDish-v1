

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';

const normalizeRoleForApi = (role: string) => {
  if (role === 'restaurant') return 'restaurant_owner';
  if (role === 'delivery') return 'delivery_partner';
  return role;
};
const normalizeRoleForUi = (role?: string) => {
  if (role === 'restaurant_owner') return 'restaurant';
  if (role === 'delivery_partner') return 'delivery';
  return role || 'customer';
};

const ROLES = [
  { id: 'customer', label: 'Diner', color: '#EF4F5F', icon: 'fa-utensils' },
  { id: 'restaurant', label: 'Partner', color: '#2563eb', icon: 'fa-store' },
  { id: 'delivery', label: 'Fleet', color: '#f59e42', icon: 'fa-motorcycle' },
];

interface LoginPageProps {
  onLoginSuccess?: (user: any) => void;
  onGoBack?: () => void;
  onViewChange?: (view: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoBack, onViewChange }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [userRole, setUserRole] = useState('customer');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const visibleRoles = ROLES;
  const roleTheme = {
    customer: {
      selectedTab: 'bg-rose-600/20 border border-rose-400 text-rose-300',
      button: 'from-rose-600 to-pink-500',
      focus: 'focus:border-rose-400'
    },
    restaurant: {
      selectedTab: 'bg-blue-600/20 border border-blue-400 text-blue-300',
      button: 'from-blue-600 to-cyan-500',
      focus: 'focus:border-blue-400'
    },
    delivery: {
      selectedTab: 'bg-amber-600/20 border border-amber-400 text-amber-300',
      button: 'from-amber-500 to-orange-500',
      focus: 'focus:border-amber-400'
    }
  } as const;
  const currentTheme = roleTheme[userRole as keyof typeof roleTheme] || roleTheme.customer;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setOtpRequired(false);
    try {
      let response;
      if (mode === 'signup') {
        response = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: normalizeRoleForApi(userRole),
        });
      } else {
        response = await authService.login({
          email: formData.email,
          password: formData.password,
        });
      }
      if (response?.otpRequired || response?.requiresOtp) {
        setOtpRequired(true);
        setLoading(false);
        return;
      }
      if (response?.token && response?.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        onLoginSuccess?.(response.user);
        const role = normalizeRoleForUi(response.user.role);
        if (role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          onViewChange?.('home');
          navigate('/');
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err: any) {
      if (err?.response?.data?.otpRequired || err?.response?.data?.requiresOtp) {
        setOtpRequired(true);
        setError(err?.response?.data?.message || 'Account not verified. A new OTP has been sent to your email.');
        return;
      }
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authService.verifyOtp({
        email: formData.email,
        otp,
      });
      if (response?.token && response?.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        const role = normalizeRoleForUi(response.user.role);
        if (role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError('OTP verification failed.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#1B1240]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.25),_transparent_55%)]"></div>
      <div className="w-full max-w-md">
        <div className="bg-[#0F172A]/90 rounded-[40px] shadow-2xl p-8 border border-indigo-900/50 backdrop-blur-md">
          <div className="text-center mb-8 flex flex-col items-center">
            <img src="/images/logo.png" alt="Logo" className="h-16 mb-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <h1 className="text-5xl font-black italic tracking-tighter text-violet-400 hidden">flavorfinder</h1>
            <p className="text-violet-200/70 text-[10px] font-black uppercase tracking-[4px] mt-2">
              {mode === 'signup' ? 'Create User Account' : 'Secure Login Console'}
            </p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-2xl text-red-300 text-sm font-bold">
              {error}
            </div>
          )}
          {/* Role Tabs - Only for aesthetics during login */}
          {mode === 'login' && (
            <div className="flex justify-between mb-8">
              {visibleRoles.map(r => (
              <button
                key={r.id}
                type="button"
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl mx-1 transition-all duration-150 ${userRole === r.id ? currentTheme.selectedTab : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                style={{ color: userRole === r.id ? r.color : undefined }}
                onClick={() => setUserRole(r.id)}
                disabled={loading}
              >
                <i className={`fas ${r.icon} text-xl mb-1`}></i>
                <span className="text-xs font-semibold">{r.label}</span>
              </button>
            ))}
            </div>
          )}
          {otpRequired ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className={`w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-bold outline-none ${currentTheme.focus}`}
                required
                disabled={loading}
              />
              <button
                type="submit"
                className={`w-full bg-gradient-to-r ${currentTheme.button} text-white p-4 rounded-2xl font-black tracking-wide`}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <input type="hidden" name="role" value="customer" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-bold outline-none ${currentTheme.focus}`}
                    required
                    disabled={loading}
                  />
                </>
              )}
              <input
                type="email"
                name="email"
                placeholder="Work Email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-bold outline-none ${currentTheme.focus}`}
                required
                disabled={loading}
              />
              <input
                type="password"
                name="password"
                placeholder="Access Password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-bold outline-none ${currentTheme.focus}`}
                required
                disabled={loading}
              />
              <button
                type="submit"
                className={`w-full p-4 rounded-2xl font-black text-white bg-gradient-to-r ${currentTheme.button} shadow-lg`}
                disabled={loading}
              >
                {loading
                  ? (mode === 'login' ? `Processing...` : 'Processing...')
                  : (mode === 'login'
                    ? `Login as ${ROLES.find(r => r.id === userRole)?.label?.toLowerCase()}`
                    : 'Sign Up')}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">
              {mode === 'login' ? 'No account?' : 'Already have an account?'}
            </span>
            <button
              className="ml-2 text-violet-300 hover:underline text-sm"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setOtpRequired(false); }}
              disabled={loading}
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
            {onGoBack && (
              <button
                className="ml-4 text-slate-300 hover:underline text-sm"
                onClick={onGoBack}
                disabled={loading}
              >
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;