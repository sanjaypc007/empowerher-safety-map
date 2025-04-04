
import React, { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { toast } from "sonner";

// Import smaller components
import DirectionsPanel from "./map/DirectionsPanel";
import SafetyLegend from "./map/SafetyLegend";
import RouteSearch from "./RouteSearch";
import { initializeLeafletIcons, drawSafetyZones, geocodeAddress } from "@/utils/mapUtils";

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
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [routingControl, setRoutingControl] = useState<any>(null);
  const [directions, setDirections] = useState<string[]>([]);
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationComplete, setNavigationComplete] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    // Fix default icon issues
    initializeLeafletIcons();

    // Create map - using default coordinates 
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

  // Calculate route function
  const calculateRoute = async (start: string, end: string) => {
    if (!mapInstance) {
      toast.error("Map not initialized");
      return;
    }
    
    console.log("Calculating route from", start, "to", end);
    
    try {
      // Remove previous route if exists
      if (routingControl) {
        mapInstance.removeControl(routingControl);
        setRoutingControl(null);
      }
      
      // Get start coordinates (use current location if start is empty)
      let startCoords: L.LatLng;
      if (start === "") {
        if (userLocation) {
          startCoords = L.latLng(userLocation[0], userLocation[1]);
        } else {
          // Get current location if not already available
          startCoords = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve(L.latLng(position.coords.latitude, position.coords.longitude)),
              (error) => reject("Geolocation failed. Please enable location access.")
            );
          });
        }
      } else {
        const coords = await geocodeAddress(start);
        if (!coords) {
          toast.error("Could not find start location");
          return;
        }
        startCoords = coords;
      }

      // Get end coordinates
      const endCoords = await geocodeAddress(end);
      if (!endCoords) {
        toast.error("Could not find destination location");
        return;
      }

      console.log("Start coordinates:", startCoords);
      console.log("End coordinates:", endCoords);

      // Set navigation mode
      setIsNavigating(true);
      setNavigationComplete(false);
      
      // Show directions panel
      setShowDirections(true);

      // Create routing control using OSRM service
      const control = L.Routing.control({
        waypoints: [
          startCoords,
          endCoords
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        lineOptions: {
          styles: [{ color: '#007bff', weight: 5 }],
          addWaypoints: false,
        },
        show: false, // Don't show the default instructions panel
      }).addTo(mapInstance);

      // Get directions when route is found
      control.on('routesfound', function(e: any) {
        console.log("Route found:", e);
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const instructions = routes[0].instructions;
          setDirections(instructions.map((step: any) => step.text));
        }
      });

      setRoutingControl(control);
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error(error instanceof Error ? error.message : "Error calculating route");
    }
  };

  // Handle locate user click
  const handleLocateUser = () => {
    if (!mapInstance) return;
    
    try {
      mapInstance.locate({ setView: true, maxZoom: 16 });
      
      mapInstance.on('locationfound', (e) => {
        const { lat, lng } = e.latlng;
        setUserLocation([lat, lng]);
        
        // Add marker at user's location
        L.marker(e.latlng).addTo(mapInstance)
          .bindPopup("Your location")
          .openPopup();
        
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
  }, [mapInstance]);

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
