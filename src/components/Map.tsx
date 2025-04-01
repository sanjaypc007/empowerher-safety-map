
import React, { useEffect, useRef, useState } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { toast } from "sonner";

// Import smaller components and utilities
import DirectionsPanel from "./map/DirectionsPanel";
import SafetyLegend from "./map/SafetyLegend";
import { useRouteCalculator } from "./map/RouteCalculator";
import { 
  initializeLeafletIcons, 
  drawSafetyZones, 
  locateUser 
} from "@/utils/mapUtils";

// Add locate button component
const LocateButton = ({ onClick }: { onClick: () => void }) => (
  <button 
    className="fixed top-4 right-4 p-3 bg-white rounded-md shadow-md z-10 flex items-center"
    onClick={onClick}
  >
    <span className="mr-2">📍</span> Locate Me
  </button>
);

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

    // Create map - using default coordinates from the HTML example
    const map = L.map(mapRef.current).setView([11.0168, 76.9558], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    setMapInstance(map);
    setIsMapLoaded(true);

    // Draw safety zones
    drawSafetyZones(map);

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Handle locate user click
  const handleLocateUser = () => {
    if (!mapInstance) return;
    
    try {
      // Remove existing user marker if any
      if (userMarker) {
        mapInstance.removeLayer(userMarker);
        setUserMarker(null);
      }
      
      // Use the locate function from mapUtils
      mapInstance.locate({ setView: true, maxZoom: 16 });
      
      mapInstance.on('locationfound', (e) => {
        const { lat, lng } = e.latlng;
        setUserLocation([lat, lng]);
        
        const marker = L.marker(e.latlng).addTo(mapInstance)
          .bindPopup("Your location")
          .openPopup();
        
        setUserMarker(marker);
        toast.success("Location found");
      });
      
      mapInstance.on('locationerror', (e) => {
        console.error("Error getting location:", e);
        toast.error("Failed to get your location. Please enable location access.");
      });
    } catch (error) {
      console.error("Error in locateUser:", error);
      toast.error("Failed to get your location");
    }
  };

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
      
      {/* Locate Me button */}
      <LocateButton onClick={handleLocateUser} />
      
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
