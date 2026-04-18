import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const AdminActivityLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getActivityLogs({ limit: 50 });
      setLogs(data?.logs || []);
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="bg-[#2A2B2E] rounded-xl p-5 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-2xl text-white">System Activity Logs</h3>
        <button onClick={fetchLogs} className="text-violet-400 hover:text-white p-2 transition">
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 py-10 text-center">Loading logs...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#17181A] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Timestamp</th>
                <th className="px-4 py-3">User / Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Target / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{log.userId?.name || 'System Auto'}</div>
                    <div className="text-xs text-slate-500">{log.userRole}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-white/10 px-2 py-1 rounded text-[10px] font-black tracking-widest uppercase">
                      {(log.action || 'Unknown').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <div className="max-w-[200px] ml-auto truncate opacity-70">
                      {JSON.stringify(log.details || {}).replace(/[{""}]/g, '') || '-'}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No activity logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminActivityLogsPanel;
