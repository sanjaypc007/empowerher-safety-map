
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
export const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  if (!address) return null;
  
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const data = await response.json();
    if (data.length === 0) throw new Error("Location not found");
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
};

// Color route based on safety levels
export const colorRouteBasedOnSafety = (control: any, route: any, mapInstance: L.Map | null) => {
  if (!control || !route || !mapInstance) return;
  
  try {
    // Get the route coordinates
    const coordinates = control._line?.getLatLngs();
    if (!coordinates || coordinates.length === 0) {
      console.error("No route coordinates found");
      return;
    }
    
    // Remove the original line if it exists
    if (control._line) {
      mapInstance.removeLayer(control._line);
    }
    
    // Divide the route into three segments to color differently
    const routeLength = coordinates.length;
    const thirdPoint = Math.floor(routeLength / 3);
    const twoThirdPoint = thirdPoint * 2;
    
    // Add colored segments
    L.polyline(coordinates.slice(0, thirdPoint), {
      color: safetyColors[SafetyLevel.HIGH_RISK],
      weight: 5
    }).addTo(mapInstance);
    
    L.polyline(coordinates.slice(thirdPoint, twoThirdPoint), {
      color: safetyColors[SafetyLevel.MEDIUM_RISK],
      weight: 5
    }).addTo(mapInstance);
    
    L.polyline(coordinates.slice(twoThirdPoint), {
      color: safetyColors[SafetyLevel.SAFE],
      weight: 5
    }).addTo(mapInstance);
  } catch (error) {
    console.error("Error coloring route:", error);
  }
};

// Function to locate user
export const locateUser = (map: L.Map, callback?: (location: [number, number]) => void) => {
  map.locate({ setView: true, maxZoom: 16 });
  
  map.on('locationfound', (e) => {
    const marker = L.marker(e.latlng).addTo(map)
      .bindPopup("Your location")
      .openPopup();
    
    if (callback) {
      callback([e.latlng.lat, e.latlng.lng]);
    }
    
    return marker;
  });
  
  map.on('locationerror', (e) => {
    console.error("Error getting location:", e);
    throw new Error("Geolocation failed. Please enable location access.");
  });
};
