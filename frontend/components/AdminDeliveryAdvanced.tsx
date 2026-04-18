import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { io, Socket } from 'socket.io-client';
import { adminService } from '../services/adminService';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Truck, CheckCircle, Clock, MapPin, Search } from 'lucide-react';

// Fix for default Leaflet icon in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2983/2983081.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const AHMEDABAD_CENTER: [number, number] = [23.0225, 72.5714];
const ZONES = [
  { name: 'Satellite', lat: 23.0163, lng: 72.5190, color: '#3b82f6' },
  { name: 'Bopal', lat: 23.0135, lng: 72.4640, color: '#8b5cf6' },
  { name: 'Maninagar', lat: 22.9961, lng: 72.5997, color: '#10b981' },
  { name: 'Navrangpura', lat: 23.0366, lng: 72.5606, color: '#f59e0b' },
  { name: 'Chandkheda', lat: 23.1098, lng: 72.5857, color: '#ef4444' }
];

export default function AdminDeliveryAdvanced() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetchDeliveries();

    // Initialize Socket
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('delivery:assigned', (data) => {
      fetchDeliveries();
    });

    newSocket.on('delivery:status:update', (data) => {
      setDeliveries(prev => prev.map(d => 
        d._id === data.deliveryId ? { ...d, status: data.status } : d
      ));
    });

    newSocket.on('partner:location:update', (data) => {
      setDeliveries(prev => prev.map(d => 
        d._id === data.deliveryId ? { 
          ...d, 
          currentLocation: { latitude: data.lat, longitude: data.lng, timestamp: data.timestamp } 
        } : d
      ));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllDeliveries();
      if (res?.data) {
        setDeliveries(res.data);
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUnassignedOrder = async (orderId: string) => {
    try {
      await adminService.assignDeliverySmart(orderId);
      await fetchDeliveries();
      alert('Delivery assigned successfully!');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error assigning delivery');
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    if (statusFilter !== 'All' && d.status !== statusFilter.toLowerCase()) return false;
    // Basic fake zone matching based on name (if we had address decoding mapping)
    // Here we'll just allow All
    return true;
  });

  const activeCount = deliveries.filter(d => ['accepted', 'picked_up', 'on_the_way'].includes(d.status)).length;
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;

  return (
    <div className="space-y-6 animate-fade-in text-white w-full max-w-full">
      <div className="flex justify-between items-center bg-gray-900 border border-gray-800 p-6 rounded-xl">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-7 h-7 text-orange-500" />
            Delivery Management System
          </h2>
          <p className="text-gray-400 mt-1">Advanced Live Tracking & Assignment Engine</p>
        </div>
        <button onClick={fetchDeliveries} className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg font-medium transition-colors">
          Refresh Map
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400">Active Deliveries</p>
            <p className="text-2xl font-bold">{activeCount}</p>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-500/20 text-green-400">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400">Completed Today</p>
            <p className="text-2xl font-bold">{deliveredCount}</p>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-full bg-orange-500/20 text-orange-400">
            <MapPin className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400">Tracked Zones</p>
            <p className="text-2xl font-bold">{ZONES.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LIST SECTION */}
        <div className="xl:col-span-1 bg-gray-800 border border-gray-700 rounded-xl flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-bold">Delivery Queue</h3>
            <div className="flex gap-2 mt-4">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-orange-500"
              >
                <option value="All">All Statuses</option>
                <option value="Accepted">Accepted</option>
                <option value="Picked_up">Picked Up</option>
                <option value="On_the_way">On The Way</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <p className="text-gray-400 text-center py-4">Loading deliveries...</p>
            ) : filteredDeliveries.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No deliveries found.</p>
            ) : (
              filteredDeliveries.map((delivery) => (
                <div key={delivery._id} className="bg-gray-900 border border-gray-700 p-4 rounded-lg relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold truncate hover:text-clip">
                      Order #{delivery.orderId?._id?.substring(0,8) || delivery._id.substring(0,8)}
                    </span>
                    <span className="px-2 py-1 bg-gray-800 text-xs rounded-full border border-gray-700 capitalize">
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>👤 Partner: {delivery.deliveryPartnerId?.name || 'Unassigned'}</p>
                    <p>🏪 From: {delivery.restaurantId?.name || 'Unknown'}</p>
                    <p>📍 To: {delivery.deliveryLocation?.address?.substring(0,25)}...</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAP SECTION */}
        <div className="xl:col-span-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden h-[600px] relative z-0">
          <MapContainer 
            center={AHMEDABAD_CENTER} 
            zoom={12} 
            scrollWheelZoom={true} 
            style={{ width: '100%', height: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Zone Overlays */}
            {ZONES.map((zone, idx) => (
              <Circle
                key={`zone-\${idx}`}
                center={[zone.lat, zone.lng]}
                pathOptions={{ fillColor: zone.color, color: zone.color, fillOpacity: 0.1 }}
                radius={3000} // 3km radius approximated
              >
                <Popup>
                  <strong>{zone.name} Zone</strong>
                </Popup>
              </Circle>
            ))}

            {/* Delivery Markers */}
            {deliveries.map(d => {
              if (!d.currentLocation || !d.currentLocation.latitude) return null;
              return (
                <Marker 
                  key={`marker-\${d._id}`}
                  position={[d.currentLocation.latitude, d.currentLocation.longitude]}
                  icon={deliveryIcon}
                >
                  <Popup className="text-black">
                    <div className="font-sans">
                      <strong className="block text-gray-900 border-b pb-1 mb-1">
                        Agent: {d.deliveryPartnerId?.name || 'Unknown'}
                      </strong>
                      <div className="text-sm">
                        <p>Status: <span className="capitalize font-medium text-orange-600">{d.status.replace('_', ' ')}</span></p>
                        <p>To: {d.deliveryLocation?.address}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
