import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SafetyLevel } from "@/types";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, ChevronDown, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

// Fixing Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create safety level colors for the routes
const safetyColors = {
  [SafetyLevel.HIGH_RISK]: "#ea384c", // Red for high risk
  [SafetyLevel.MEDIUM_RISK]: "#f0ad4e", // Yellow/orange for medium risk
  [SafetyLevel.SAFE]: "#2ecc71", // Green for safe
};

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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance) return;

    // Fix default icon issues
    const defaultIcon = L.icon({
      iconUrl: icon,
      shadowUrl: iconShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    L.Marker.prototype.options.icon = defaultIcon;

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

    // Draw safety zones (placeholder visualization)
    drawSafetyZones(map);

    return () => {
      if (map) {
        map.remove();
      }
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Function to draw safety zones on the map
  const drawSafetyZones = (map: L.Map) => {
    // Example safety zones - these would come from your backend in a real implementation
    const safetyZones = [
      { center: [28.6139, 77.2090], radius: 500, level: SafetyLevel.HIGH_RISK },
      { center: [28.6229, 77.2080], radius: 300, level: SafetyLevel.MEDIUM_RISK },
      { center: [28.6339, 77.2190], radius: 400, level: SafetyLevel.SAFE },
    ];

    safetyZones.forEach(zone => {
      const color = safetyColors[zone.level];
      L.circle(zone.center, {
        radius: zone.radius,
        color,
        fillColor: color,
        fillOpacity: 0.3
      }).addTo(map);
    });
  };

  // Calculate route between start and end points
  const calculateRoute = (start: string, end: string) => {
    if (!mapInstance) return;
    
    // Remove previous route if exists
    if (routeControl) {
      mapInstance.removeControl(routeControl);
    }

    // Helper function for geocoding
    const geocode = async (query: string): Promise<[number, number] | null> => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data && data.length > 0) {
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
        return null;
      } catch (error) {
        console.error("Geocoding error:", error);
        return null;
      }
    };

    // Process routing
    const processRoute = async () => {
      let startCoords: [number, number];
      let endCoords: [number, number] | null;

      // Use current location if start is empty
      if (start === "" && userLocation) {
        startCoords = userLocation;
      } else {
        const coords = await geocode(start);
        if (!coords) {
          toast.error("Could not find start location");
          return;
        }
        startCoords = coords;
      }

      // Get end coordinates
      endCoords = await geocode(end);
      if (!endCoords) {
        toast.error("Could not find destination location");
        return;
      }

      // Set navigation mode
      setIsNavigating(true);
      
      // Show directions panel
      setShowDirections(true);

      // Create routing control
      const control = L.Routing.control({
        waypoints: [
          L.latLng(startCoords[0], startCoords[1]),
          L.latLng(endCoords[0], endCoords[1])
        ],
        lineOptions: {
          styles: [{ color: '#8B5CF6', weight: 5 }], // Default color in empowerher-primary
          addWaypoints: false, // Prevent waypoint addition on click
        },
        show: false, // Don't show the default instructions panel
        routeWhileDragging: true,
        fitSelectedRoutes: true,
      }).addTo(mapInstance);

      // Get directions when route is found
      control.on('routesfound', function(e: any) {
        const routes = e.routes;
        const instructions = routes[0].instructions;
        setDirections(instructions.map((step: any) => step.text));
        
        // In a real app, here you would integrate with your FastAPI
        // to color the route segments based on safety data
        // This is placeholder logic for now
        colorRouteBasedOnSafety(control, routes[0]);
      });

      setRouteControl(control);
    };

    processRoute();
  };

  // Placeholder function for coloring route segments by safety
  // This is where you'll integrate with your FastAPI
  const colorRouteBasedOnSafety = (control: any, route: any) => {
    // Placeholder - in a real app, this would come from your API
    if (control && route && control._line) {
      // Example: Split route into segments (this is just a visualization)
      const routeLength = control._line.getLatLngs().length;
      const thirdPoint = Math.floor(routeLength / 3);
      const twoThirdPoint = thirdPoint * 2;
      
      // Create new polylines with different colors
      const coordinates = control._line.getLatLngs();
      
      // Remove the original line
      mapInstance?.removeLayer(control._line);
      
      // Add colored segments
      L.polyline(coordinates.slice(0, thirdPoint), {
        color: safetyColors[SafetyLevel.HIGH_RISK],
        weight: 5
      }).addTo(mapInstance!);
      
      L.polyline(coordinates.slice(thirdPoint, twoThirdPoint), {
        color: safetyColors[SafetyLevel.MEDIUM_RISK],
        weight: 5
      }).addTo(mapInstance!);
      
      L.polyline(coordinates.slice(twoThirdPoint), {
        color: safetyColors[SafetyLevel.SAFE],
        weight: 5
      }).addTo(mapInstance!);
    }
  };

  // Expose the calculateRoute function to the parent component
  // This will be called from the RouteSearch component
  React.useEffect(() => {
    if (window) {
      (window as any).calculateMapRoute = calculateRoute;
    }
    return () => {
      if (window) {
        delete (window as any).calculateMapRoute;
      }
    };
  }, [mapInstance, userLocation]);

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
      
      {/* Directions panel - Google Maps style */}
      {directions.length > 0 && (
        <>
          <button 
            className="absolute bottom-4 right-4 px-4 py-2 bg-white rounded-md shadow-md z-10 text-sm flex items-center font-medium"
            onClick={() => setShowDirections(!showDirections)}
          >
            {showDirections ? (
              <>
                <ChevronDown className="w-4 h-4 mr-1" /> Hide Directions
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 mr-1" /> Show Directions
              </>
            )}
          </button>
          
          {showDirections && (
            <Card className="absolute bottom-16 right-4 w-[350px] max-h-[50vh] shadow-lg z-10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">Directions</h3>
                  <span className="text-xs text-gray-500">{directions.length} steps</span>
                </div>
                <ScrollArea className="h-[calc(50vh-100px)]">
                  <ul className="space-y-3">
                    {directions.map((step, index) => (
                      <li key={index} className="flex py-2 border-b border-gray-100 last:border-b-0">
                        <span className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Safety legend */}
      <Card className="absolute bottom-4 left-4 w-auto">
        <CardContent className="p-3">
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-semibold">Safety Zones</h3>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-empowerher-red"></div>
              <span className="text-xs">High Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-empowerher-yellow"></div>
              <span className="text-xs">Medium Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-empowerher-green"></div>
              <span className="text-xs">Safe</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Map;
