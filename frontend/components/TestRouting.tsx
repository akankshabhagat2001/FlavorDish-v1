import React from 'react';
import MapTilerDirectionsMap from './MapTilerDirectionsMap';

const TestRouting = () => {
  // Test coordinates in Ahmedabad
  const userLocation = {
    lat: 23.0225,
    lng: 72.5714,
    latitude: 23.0225,
    longitude: 72.5714
  };

  const restaurantLocation = {
    lat: 23.0300,
    lng: 72.5800,
    latitude: 23.0300,
    longitude: 72.5800
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MapTiler Routing Test</h1>
      <p className="mb-4">Testing route from user location to restaurant in Ahmedabad</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">User Location</h3>
          <p>Lat: {userLocation.lat}</p>
          <p>Lng: {userLocation.lng}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold">Restaurant Location</h3>
          <p>Lat: {restaurantLocation.lat}</p>
          <p>Lng: {restaurantLocation.lng}</p>
        </div>
      </div>

      <MapTilerDirectionsMap
        origin={userLocation}
        destination={restaurantLocation}
        destinationName="Test Restaurant"
        height="500px"
      />
    </div>
  );
};

export default TestRouting;