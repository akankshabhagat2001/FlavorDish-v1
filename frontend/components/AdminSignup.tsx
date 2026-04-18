import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';

const AdminSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.adminSignup({ email, password });
      setSuccess('Admin registered successfully! You can now login.');
      setTimeout(() => navigate('/admin-login'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1B1240]">
      <div className="w-full max-w-md bg-[#0F172A]/90 rounded-[48px] shadow-2xl p-10">
        <h2 className="text-3xl font-black italic text-purple-500 mb-6 text-center">Admin Signup</h2>
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-2xl text-sm font-bold mb-6 text-center">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-2xl text-sm font-bold mb-6 text-center">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Admin Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#1B1240] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Secure Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#1B1240] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black text-lg transition-all duration-200">
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <a href="/admin-login" className="text-purple-400 hover:underline font-bold">Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
