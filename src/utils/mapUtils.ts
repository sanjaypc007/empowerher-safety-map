
import L from 'leaflet';
import { SafetyLevel } from "@/types";

// Create safety level colors for the routes
export const safetyColors = {
  [SafetyLevel.HIGH_RISK]: "#ea384c", // Red for high risk
  [SafetyLevel.MEDIUM_RISK]: "#f0ad4e", // Yellow/orange for medium risk
  [SafetyLevel.SAFE]: "#2ecc71", // Green for safe
};

// Initialize Leaflet icons to fix icon loading issues
export const initializeLeafletIcons = () => {
  // Set default icon path for Leaflet
  const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
  const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
  
  const defaultIcon = L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  
  L.Marker.prototype.options.icon = defaultIcon;
};

// Draw safety zones on the map
export const drawSafetyZones = (map: L.Map) => {
  // Example safety zones - these would come from your backend in a real implementation
  const safetyZones = [
    { center: [11.0168, 76.9558], radius: 500, level: SafetyLevel.HIGH_RISK },
    { center: [11.0268, 76.9658], radius: 300, level: SafetyLevel.MEDIUM_RISK },
    { center: [11.0368, 76.9758], radius: 400, level: SafetyLevel.SAFE },
  ];

  safetyZones.forEach(zone => {
    const color = safetyColors[zone.level];
    L.circle(zone.center as L.LatLngExpression, {
      radius: zone.radius,
      color,
      fillColor: color,
      fillOpacity: 0.3
    }).addTo(map);
  });
};

// Geocode addresses using OpenStreetMap Nominatim
export const geocodeAddress = async (address: string): Promise<L.LatLng | null> => {
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

// Calculate route between two points
export const calculateRoute = (map: L.Map, startCoords: L.LatLng, endCoords: L.LatLng) => {
  try {
    // Create the routing control using OSRM service
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
    }).addTo(map);
    
    return control;
  } catch (error) {
    console.error("Error calculating route:", error);
    throw error;
  }
};
