import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const AdminDeliveryPanel: React.FC = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDeliveryPartners({ limit: 100 });
      setPartners(data?.partners || []);
    } catch (err) {
      console.error('Failed to fetch delivery partners', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return (
    <div className="bg-[#2A2B2E] rounded-xl p-5 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-2xl text-white">Delivery Network</h3>
        <button onClick={fetchPartners} className="text-violet-400 hover:text-white p-2 transition">
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 py-10 text-center">Loading network...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#17181A] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Partner Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Total Deliveries</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Active Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {partners.map(partner => (
                <tr key={partner._id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-semibold text-white">{partner.name}</td>
                  <td className="px-4 py-3">{partner.phone || 'N/A'}</td>
                  <td className="px-4 py-3 font-black text-white">{partner.totalDeliveries || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${partner.isAvailable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {partner.isAvailable ? 'Available' : 'Busy/Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {partner.activeOrder ? (
                      <span className="text-violet-400 text-xs font-bold line-clamp-1">
                        #{String(partner.activeOrder._id).slice(-4)} - {partner.activeOrder.restaurant?.name}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">None</span>
                    )}
                  </td>
                </tr>
              ))}
              {partners.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No delivery partners found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDeliveryPanel;
