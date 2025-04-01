
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
  const icon = require('leaflet/dist/images/marker-icon.png').default;
  const iconShadow = require('leaflet/dist/images/marker-shadow.png').default;
  
  const defaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  
  L.Marker.prototype.options.icon = defaultIcon;
};

// Draw safety zones on the map
export const drawSafetyZones = (map: L.Map) => {
  // Example safety zones - these would come from your backend in a real implementation
  const safetyZones = [
    { center: [28.6139, 77.2090], radius: 500, level: SafetyLevel.HIGH_RISK },
    { center: [28.6229, 77.2080], radius: 300, level: SafetyLevel.MEDIUM_RISK },
    { center: [28.6339, 77.2190], radius: 400, level: SafetyLevel.SAFE },
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

// Color route based on safety levels
export const colorRouteBasedOnSafety = (control: any, route: any, mapInstance: L.Map | null) => {
  if (control && route && control._line && mapInstance) {
    // Placeholder - in a real app, this would come from your API
    const routeLength = control._line.getLatLngs().length;
    const thirdPoint = Math.floor(routeLength / 3);
    const twoThirdPoint = thirdPoint * 2;
    
    // Create new polylines with different colors
    const coordinates = control._line.getLatLngs();
    
    // Remove the original line
    mapInstance.removeLayer(control._line);
    
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
  }
};

// Geocoding helper function
export const geocode = async (query: string): Promise<[number, number] | null> => {
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
