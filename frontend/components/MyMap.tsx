// @ts-nocheck
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// These coordinates are for Ahmedabad
const position = [23.0225, 72.5714]; 
const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;

const MyMap = () => {
  return (
    <div style={{ height: "500px", width: "100%" }}>
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`}
          attribution='&copy; MapTiler &copy; OpenStreetMap contributors'
        />
        <Marker position={position}>
          <Popup>
            Testing MapTiler in Ahmedabad!
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MyMap;