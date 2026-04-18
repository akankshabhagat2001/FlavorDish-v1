import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.adminLogin({ email, password });
      if (response?.message === 'Login successful') {
        // Successfully logged in as admin, redirect to admin dashboard
        navigate('/admin-dashboard');
      } else {
        setError(response?.message || 'Access Denied. Invalid credentials.');
      }
    } catch (err: any) {
      console.error('Admin Auth error:', err);
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Access Denied. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#1B1240]">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.25),_transparent_55%)]"></div>
      
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="bg-[#0F172A]/90 rounded-[48px] shadow-2xl overflow-hidden border border-indigo-900/50 backdrop-blur-md">
          
          <div className="p-10 text-center border-b border-gray-800">
            <div className="text-4xl font-black italic tracking-tighter mb-2 text-purple-500 text-shadow-sm">
              flavorfinder
            </div>
            <p className="text-purple-400 font-black text-[10px] uppercase tracking-[4px]">
              Secure Admin Console
            </p>
          </div>

          <div className="p-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-2xl text-sm font-bold mb-6 text-center" style={{ transition: 'opacity 0.5s', opacity: error ? 1 : 0 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Admin Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full px-6 py-4 bg-slate-800 text-white border border-slate-700 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold placeholder-gray-600" 
                  placeholder="admin@flavorfinder.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Secure Password</label>
                <input 
                  type="password" 
                  required 
                  className="w-full px-6 py-4 bg-slate-800 text-white border border-slate-700 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold placeholder-gray-600" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full text-white py-5 rounded-[24px] font-black text-lg shadow-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>Access Console</span>
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 text-center">
              <a href="/admin-signup" className="text-purple-400 hover:underline font-bold">Don't have an account? Sign up</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
