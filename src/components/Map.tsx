
import React, { useEffect, useRef, useState } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { toast } from "sonner";

// Import smaller components and utilities
import DirectionsPanel from "./map/DirectionsPanel";
import SafetyLegend from "./map/SafetyLegend";
import { useRouteCalculator } from "./map/RouteCalculator";
import { initializeLeafletIcons, drawSafetyZones } from "@/utils/mapUtils";

const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [routeControl, setRouteControl] = useState<any>(null);
  const [directions, setDirections] = useState<string[]>([]);
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationComplete, setNavigationComplete] = useState(false);

  // Use our route calculator hook
  const { calculateRoute } = useRouteCalculator({
    mapInstance,
    userLocation,
    setRoutingControl: setRouteControl,
    routingControl: routeControl,
    setDirections,
    setIsNavigating,
    setNavigationComplete,
    setShowDirections
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    // Fix default icon issues
    initializeLeafletIcons();

    // Create map
    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    setMapInstance(map);
    setIsMapLoaded(true);

    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        map.setView([latitude, longitude], 13);
        
        const marker = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("You are here")
          .openPopup();
        
        setUserMarker(marker);
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      { enableHighAccuracy: true }
    );

    // Watch for position changes
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        
        if (userMarker) {
          userMarker.setLatLng([latitude, longitude]);
        }
      },
      (error) => {
        console.error("Error watching location:", error);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    // Draw safety zones
    drawSafetyZones(map);

    return () => {
      if (map) {
        map.remove();
      }
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Function to handle navigation completion
  const completeNavigation = () => {
    setNavigationComplete(true);
    setIsNavigating(false);
    toast.success("Navigation completed! Please submit your feedback.");
    
    // Notify parent component to switch to reports tab
    if (window) {
      (window as any).navigateToReports && (window as any).navigateToReports();
    }
  };

  // Expose the calculateRoute function to the parent component
  React.useEffect(() => {
    if (window) {
      (window as any).calculateMapRoute = calculateRoute;
    }
    return () => {
      if (window) {
        delete (window as any).calculateMapRoute;
      }
    };
  }, [calculateRoute]);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] mt-16">
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full bg-gray-100 relative">
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-empowerher-primary"></div>
          </div>
        )}
      </div>
      
      {/* Directions panel */}
      <DirectionsPanel 
        directions={directions}
        isNavigating={isNavigating}
        navigationComplete={navigationComplete}
        showDirections={showDirections}
        setShowDirections={setShowDirections}
        completeNavigation={completeNavigation}
      />
      
      {/* Safety legend */}
      <SafetyLegend />
    </div>
  );
};

export default Map;
