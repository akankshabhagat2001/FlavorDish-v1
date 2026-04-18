import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';

interface AdminLoginPageProps {
  onLoginSuccess?: (user: any) => void;
  onGoBack?: () => void;
  onViewChange?: (view: string) => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onGoBack, onViewChange }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Specifically use the admin login endpoint
      const response = await authService.adminLogin({
        email: formData.email,
        password: formData.password,
      });

      if (response?.token && response?.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        onLoginSuccess?.(response.user);
        
        if (response.user.role === 'admin') {
          navigate('/admin-dashboard');
        }
      } else {
        setError('Authentication failed. Please verify admin credentials.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#110C24]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,79,95,0.15),_transparent_65%)]"></div>
      <div className="w-full max-w-md">
        <div className="bg-[#1A1A1A]/90 rounded-[40px] shadow-2xl p-8 border border-red-900/40 backdrop-blur-md relative overflow-hidden">
          
          {/* Subtle top border glow for Admin */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>

          <div className="text-center mb-8 flex flex-col items-center">
            <img src="/images/logo.png" alt="Logo" className="h-20 mb-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <h1 className="text-5xl font-black italic tracking-tighter text-red-500 hidden">flavorfinder</h1>
            <p className="text-red-400 font-black uppercase tracking-[5px] mt-4 text-xs">
              Command Console
            </p>
            <p className="text-gray-400 text-[10px] mt-1 font-bold">AUTHORIZED ADMINISTRATORS ONLY</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-2xl text-red-400 text-sm font-bold text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
               <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-2 mb-1 block">Admin Email</label>
               <input
                 type="email"
                 name="email"
                 placeholder="admin@flavorfinder.com"
                 value={formData.email}
                 onChange={handleChange}
                 className="w-full px-5 py-4 bg-black/40 border border-slate-700/60 rounded-2xl text-white font-bold outline-none focus:border-red-500/70 transition-colors"
                 required
                 disabled={loading}
               />
            </div>
            
            <div>
               <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-2 mb-1 block">Security Passphrase</label>
               <input
                 type="password"
                 name="password"
                 placeholder="••••••••"
                 value={formData.password}
                 onChange={handleChange}
                 className="w-full px-5 py-4 bg-black/40 border border-slate-700/60 rounded-2xl text-white font-bold outline-none focus:border-red-500/70 transition-colors"
                 required
                 disabled={loading}
               />
            </div>
            
            <button
              type="submit"
              className="w-full p-4 rounded-2xl font-black text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-900/30 transition-all mt-4"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Access Command Console'}
            </button>
          </form>
          
          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <button
              className="text-gray-500 hover:text-white uppercase tracking-widest text-[10px] font-bold transition-colors flex items-center justify-center gap-2 w-full"
              onClick={onGoBack}
              disabled={loading}
            >
              <i className="fa-solid fa-arrow-left"></i> Return to Public App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
