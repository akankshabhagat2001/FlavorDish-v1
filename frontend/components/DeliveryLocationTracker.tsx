import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../services/runtimeConfig';

export default function DeliveryLocationTracker() {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [status, setStatus] = useState<string>('accepted');
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Initialize Socket.io
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Start tracking location
  const startTracking = (activeOrderId: string) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setOrderId(activeOrderId);
    setIsTracking(true);

    // Watch position every 5 seconds
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);

        // Emit location to server
        if (socketRef.current) {
          socketRef.current.emit('send-location', {
            orderId: activeOrderId,
            location,
            status,
            timestamp: Date.now(),
          });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get GPS location. Please check your permissions.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Stop tracking location
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setCurrentLocation(null);
  };

  // Update status
  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    if (socketRef.current && orderId) {
      socketRef.current.emit('send-location', {
        orderId,
        location: currentLocation,
        status: newStatus,
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div className="delivery-tracker">
      <div className="tracker-container">
        <h3>Live Delivery Tracking</h3>

        {!isTracking ? (
          <div>
            <input
              type="text"
              placeholder="Enter Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              style={{
                padding: '10px',
                marginRight: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
              }}
            />
            <button
              onClick={() => startTracking(orderId)}
              disabled={!orderId}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4ECDC4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Start Tracking
            </button>
          </div>
        ) : (
          <div>
            <div className="location-display">
              {currentLocation ? (
                <div>
                  <p>
                    <strong>Current Location:</strong>
                  </p>
                  <p>Latitude: {currentLocation.lat.toFixed(6)}</p>
                  <p>Longitude: {currentLocation.lng.toFixed(6)}</p>
                </div>
              ) : (
                <p>Getting location...</p>
              )}
            </div>

            <div className="status-selector">
              <label>
                <strong>Order Status:</strong>
              </label>
              <select
                value={status}
                onChange={(e) => updateStatus(e.target.value)}
                style={{
                  padding: '8px',
                  marginRight: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
              >
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="on-way">On Way</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <button
              onClick={stopTracking}
              style={{
                padding: '10px 20px',
                backgroundColor: '#FF6B6B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              Stop Tracking
            </button>
          </div>
        )}
      </div>

      <style>{`
        .delivery-tracker {
          background: white;
          padding: 20px;
          borderRadius: 12px;
          boxShadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tracker-container {
          maxWidth: 500px;
          margin: 0 auto;
        }

        .location-display {
          background: #f5f5f5;
          padding: 15px;
          borderRadius: 8px;
          marginBottom: 15px;
        }

        .status-selector {
          marginBottom: 15px;
        }

        .status-selector select {
          display: block;
          width: 100%;
          marginTop: 5px;
        }
      `}</style>
    </div>
  );
}
