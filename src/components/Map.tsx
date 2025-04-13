import React, { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { toast } from "sonner";

// Import smaller components
import DirectionsPanel from "./map/DirectionsPanel";
import SafetyLegend from "./map/SafetyLegend";
import RouteSearch from "./RouteSearch";
import { 
  initializeLeafletIcons, 
  safetyColors, 
  SafetyLevel, 
  trackUserLocation 
} from "@/utils/mapUtils";

// Add CSS for the pulsing location marker
const injectCustomCSS = () => {
  const style = document.createElement('style');
  style.textContent = `
    .user-location-marker {
      position: relative;
    }
    .pulse {
      display: block;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #4285f4;
      box-shadow: 0 0 0 rgba(66, 133, 244, 0.4);
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(66, 133, 244, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(66, 133, 244, 0);
      }
    }
  `;
  document.head.appendChild(style);
};

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
  const [routeLayer, setRouteLayer] = useState<L.GeoJSON | null>(null);
  const [directions, setDirections] = useState<string[]>([]);
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationComplete, setNavigationComplete] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [locationTracker, setLocationTracker] = useState<any>(null);
  const [startMarker, setStartMarker] = useState<L.Marker | null>(null);
  const [endMarker, setEndMarker] = useState<L.Marker | null>(null);

  // Initialize map with a delay to ensure DOM is fully ready
  useEffect(() => {
    // Inject the custom CSS for the pulsing marker
    injectCustomCSS();

    if (!mapRef.current || mapInstance) return;

    // Fix default icon issues
    initializeLeafletIcons();
    
    // Create map with a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        // Create map with a temporary default location (will be overridden when we get user location)
        const map = L.map(mapRef.current).setView([0, 0], 2); // Start with world view
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        setMapInstance(map);
        setIsMapLoaded(true);
        
        // Ensure map is fully initialized before drawing safety zones and tracking
        map.whenReady(() => {
          try {
            // Draw safety zones first
            drawSafetyZones(map);
            
            // Add a message to indicate we're getting location
            toast.info("Getting your location...");
            
            // Start tracking user location with more aggressive settings
            const tracker = trackUserLocation(map);
            setLocationTracker(tracker);
            tracker.startTracking();
            
            // Request location with max accuracy
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords;
                  
                  // Store location and center map on it
                  setUserLocation([latitude, longitude]);
                  map.setView([latitude, longitude], 16);
                  console.log("Initial position set:", latitude, longitude);
                  
                  toast.success("Location found");
                },
                (error) => {
                  console.error("Geolocation error:", error);
                  toast.error("Could not get your precise location. Please ensure you've granted location permissions.");
                },
                { 
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0
                }
              );
            }
          } catch (error) {
            console.error("Error in map initialization:", error);
          }
        });
      } catch (error) {
        console.error("Error initializing map:", error);
        toast.error("Failed to initialize map. Please refresh the page.");
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstance) {
        mapInstance.remove();
      }
      // Stop location tracking when component unmounts
      if (locationTracker) {
        locationTracker.stopTracking();
      }
    };
  }, []);

  // Draw safety zones on the map with additional error handling
  const drawSafetyZones = (map: L.Map) => {
    if (!map || !map.getCenter()) {
      console.error("Map not properly initialized for drawing safety zones");
      return;
    }
    
    try {
      // Example safety zones - these would come from your backend in a real implementation
      const safetyZones = [
        { center: [11.0168, 76.9558], radius: 500, level: SafetyLevel.HIGH_RISK },
        { center: [11.0268, 76.9658], radius: 300, level: SafetyLevel.MEDIUM_RISK },
        { center: [11.0368, 76.9758], radius: 400, level: SafetyLevel.SAFE },
      ];

      safetyZones.forEach(zone => {
        try {
          const color = safetyColors[zone.level];
          L.circle(zone.center as L.LatLngExpression, {
            radius: zone.radius,
            color,
            fillColor: color,
            fillOpacity: 0.3
          }).addTo(map);
        } catch (error) {
          console.error("Error adding safety zone:", error);
        }
      });
    } catch (error) {
      console.error("Error in drawSafetyZones:", error);
    }
  };

  // Geocode addresses using OpenStreetMap Nominatim
  const geocodeAddress = async (address: string): Promise<L.LatLng | null> => {
    if (!address) return null;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data.length === 0) throw new Error("Location not found");
      return L.latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  };

  // Generate directions from OSRM response
  const generateDirections = (route: any): string[] => {
    if (!route || !route.legs || !route.legs[0] || !route.legs[0].steps) {
      return ["No directions available"];
    }
    
    return route.legs[0].steps.map((step: any) => {
      // Extract the instruction text from the OSRM step
      const instruction = step.maneuver.instruction || "Continue straight";
      const distance = (step.distance / 1000).toFixed(1); // Convert to km
      return `${instruction} for ${distance} km`;
    });
  };

  // Clear previous route elements
  const clearPreviousRoute = () => {
    if (!mapInstance) return;
    
    // Remove previous route layer
    if (routeLayer) {
      mapInstance.removeLayer(routeLayer);
      setRouteLayer(null);
    }
    
    // Remove previous routing control
    if (routingControl) {
      mapInstance.removeControl(routingControl);
      setRoutingControl(null);
    }
    
    // Remove previous markers
    if (startMarker) {
      mapInstance.removeLayer(startMarker);
      setStartMarker(null);
    }
    
    if (endMarker) {
      mapInstance.removeLayer(endMarker);
      setEndMarker(null);
    }
    
    // Clear directions
    setDirections([]);
    setShowDirections(false);
  };

  // Calculate route using OSRM API directly
  const calculateRoute = async (start: string, end: string) => {
    if (!mapInstance) {
      toast.error("Map not initialized");
      return;
    }
    
    console.log("Calculating route from", start, "to", end);
    
    try {
      // Clear previous route
      clearPreviousRoute();
      
      // Get start coordinates (use current location if start is empty)
      let startCoords: L.LatLng;
      if (!start.trim()) {
        if (userLocation) {
          startCoords = L.latLng(userLocation[0], userLocation[1]);
        } else if (locationTracker) {
          // Try to get current position from the tracker
          try {
            startCoords = await locationTracker.getCurrentPosition();
          } catch (error) {
            toast.error("Could not determine your current location. Please enable location access.");
            return;
          }
        } else {
          // Get current location as a last resort
          startCoords = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const coords = L.latLng(position.coords.latitude, position.coords.longitude);
                setUserLocation([position.coords.latitude, position.coords.longitude]);
                resolve(coords);
              },
              (error) => {
                reject(new Error("Could not determine your current location. Please enable location access."));
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
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
      
      // Create custom icons for start and end markers
      const startIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #1E90FF; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      const endIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #FF4136; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      // Add markers for start and end with custom icons
      setStartMarker(L.marker(startCoords, {icon: startIcon}).addTo(mapInstance).bindPopup("Start"));
      setEndMarker(L.marker(endCoords, {icon: endIcon}).addTo(mapInstance).bindPopup("Destination"));
      
      // Show directions panel
      setShowDirections(true);
      
      try {
        // Use OSRM API directly - more reliable than Leaflet Routing Machine
        const response = await axios.get(
          `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=full&geometries=geojson&steps=true&annotations=true`
        );
        
        if (!response.data || !response.data.routes || response.data.routes.length === 0) {
          throw new Error("No route found");
        }
        
        const routeData = response.data.routes[0];
        const routeGeometry = routeData.geometry;
        
        // Create GeoJSON layer for the route
        const polyline = L.geoJSON(routeGeometry, {
          style: { color: '#007bff', weight: 5 }
        }).addTo(mapInstance);
        
        setRouteLayer(polyline);
        
        // Fit map to route bounds
        mapInstance.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        
        // Generate directions from the route
        const directionsText = generateDirections(routeData);
        setDirections(directionsText);
        
      } catch (error) {
        console.error("OSRM routing error:", error);
        
        // Fallback to Leaflet Routing Machine if OSRM direct API fails
        toast.info("Using fallback routing service...");
        
        // Use a try-catch to handle the Leaflet Routing Machine fallback
        try {
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
        } catch (fallbackError) {
          console.error("Fallback routing error:", fallbackError);
          toast.error("Unable to calculate route. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error(error instanceof Error ? error.message : "Error calculating route");
    }
  };

  // Handle locate user click (center map on current location with improved accuracy)
  const handleLocateUser = () => {
    if (!mapInstance) return;
    
    try {
      toast.info("Finding your precise location...");
      
      // Clear previous location tracking
      if (locationTracker) {
        locationTracker.stopTracking();
      }
      
      // Start fresh tracking with maximum accuracy
      const tracker = trackUserLocation(mapInstance);
      setLocationTracker(tracker);
      tracker.startTracking();
      
      // Also use the map's built-in locate method as a backup
      mapInstance.locate({ 
        setView: true, 
        maxZoom: 16,
        enableHighAccuracy: true,
        watch: true,
        timeout: 10000
      });
      
      mapInstance.on('locationfound', (e) => {
        const { lat, lng } = e.latlng;
        setUserLocation([lat, lng]);
        console.log("User located at:", lat, lng);
        toast.success("Location found");
      });
      
      mapInstance.on('locationerror', (e) => {
        console.error("Error getting location:", e);
        toast.error("Failed to get your location. Please ensure location services are enabled.");
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
  useEffect(() => {
    if (window) {
      (window as any).calculateMapRoute = calculateRoute;
    }
    return () => {
      if (window) {
        delete (window as any).calculateMapRoute;
      }
    };
  }, [mapInstance, userLocation, locationTracker]);

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
