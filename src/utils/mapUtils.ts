
import L from 'leaflet';
import { SafetyLevel } from "@/types";

// Create safety level colors for the routes
export const safetyColors = {
  [SafetyLevel.HIGH_RISK]: "#ea384c", // Red for high risk
  [SafetyLevel.MEDIUM_RISK]: "#f0ad4e", // Yellow/orange for medium risk
  [SafetyLevel.SAFE]: "#2ecc71", // Green for safe
};

// Re-export SafetyLevel from types to fix the import error
export { SafetyLevel };

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

// Track user's current location and display it on the map
export const trackUserLocation = (map: L.Map): { 
  marker: L.Marker | null, 
  circle: L.Circle | null,
  startTracking: () => void,
  stopTracking: () => void,
  getCurrentPosition: () => Promise<L.LatLng>
} => {
  let locationMarker: L.Marker | null = null;
  let accuracyCircle: L.Circle | null = null;
  let watchId: number | null = null;
  let currentPosition: L.LatLng | null = null;
  
  const updateLocation = (position: GeolocationPosition) => {
    try {
      const { latitude, longitude, accuracy } = position.coords;
      const latlng = L.latLng(latitude, longitude);
      currentPosition = latlng;
      
      // Clear existing markers/circles to prevent duplicates
      if (locationMarker) map.removeLayer(locationMarker);
      if (accuracyCircle) map.removeLayer(accuracyCircle);
      
      // Create custom icon for user location
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="pulse"></div>',
        iconSize: [15, 15],
        iconAnchor: [7, 7]
      });
      
      // Always create a new marker to ensure it reflects the latest position
      locationMarker = L.marker(latlng, { icon: userIcon }).addTo(map);
      locationMarker.bindPopup("Your current location").openPopup();

      // Use a much smaller, less obtrusive accuracy circle
      accuracyCircle = L.circle(latlng, {
        radius: Math.min(accuracy / 20, 10), // Even smaller radius, max 10 meters
        color: '#4A90E2',
        fillColor: '#4A90E2',
        fillOpacity: 0.02, // Further reduced opacity
        weight: 1
      }).addTo(map);
      
      console.log("Location updated:", latitude, longitude);
      
      // Center map on user's location only on initial update or if very different
      if (!map.getBounds().contains(latlng)) {
        map.setView(latlng, 16);
      }
    } catch (error) {
      console.error("Error updating location marker:", error);
    }
  };

  const handleError = (error: GeolocationPositionError) => {
    console.error("Geolocation error:", error.message);
    
    // Show a toast message to the user about the error
    if (window && (window as any).showLocationError) {
      (window as any).showLocationError(error.message);
    }
    
    // Try to fall back to IP-based geolocation if browser geolocation fails
    fallbackToIPGeolocation();
  };
  
  // Fallback to IP-based geolocation when browser geolocation fails
  const fallbackToIPGeolocation = async () => {
    try {
      // Use ipinfo.io to get location based on IP
      const response = await fetch('https://ipinfo.io/json?token=2c8e3d8c50f4d2');
      const data = await response.json();
      
      if (data && data.loc) {
        const [lat, lng] = data.loc.split(',').map(Number);
        const latlng = L.latLng(lat, lng);
        
        // Update the current position
        currentPosition = latlng;
        
        // Create a marker for this location
        if (locationMarker) map.removeLayer(locationMarker);
        if (accuracyCircle) map.removeLayer(accuracyCircle);
        
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: '<div class="pulse"></div>',
          iconSize: [15, 15],
          iconAnchor: [7, 7]
        });
        
        locationMarker = L.marker(latlng, { icon: userIcon }).addTo(map);
        locationMarker.bindPopup("Your approximate location (based on IP)").openPopup();
        
        // Center map on this location
        map.setView(latlng, 14); // Slightly less zoomed in for IP-based location
        
        console.log("Fallback location set from IP:", lat, lng);
      }
    } catch (fallbackError) {
      console.error("Error in IP geolocation fallback:", fallbackError);
    }
  };

  const startTracking = () => {
    if ("geolocation" in navigator) {
      // Clear the existing watch if any
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      // Force a clear cache request for more accurate initial position
      navigator.geolocation.getCurrentPosition(
        updateLocation, 
        handleError, 
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Force fresh location, don't use cached
        }
      );
      
      // Set a more aggressive watch with very frequent updates
      watchId = navigator.geolocation.watchPosition(
        updateLocation, 
        handleError, 
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Never use cached positions
        }
      );
    } else {
      // Browser doesn't support geolocation API
      fallbackToIPGeolocation();
    }
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    
    if (locationMarker) {
      map.removeLayer(locationMarker);
      locationMarker = null;
    }
    
    if (accuracyCircle) {
      map.removeLayer(accuracyCircle);
      accuracyCircle = null;
    }
  };
  
  // New method to get current position as a promise
  const getCurrentPosition = (): Promise<L.LatLng> => {
    return new Promise((resolve, reject) => {
      if (currentPosition) {
        // If we already have a position, return it immediately
        resolve(currentPosition);
      } else {
        // Otherwise, get a fresh position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const latlng = L.latLng(latitude, longitude);
            currentPosition = latlng;
            resolve(latlng);
          },
          (error) => {
            console.error("Error getting current position:", error);
            // Try IP-based geolocation as a fallback
            fetch('https://ipinfo.io/json?token=2c8e3d8c50f4d2')
              .then(response => response.json())
              .then(data => {
                if (data && data.loc) {
                  const [lat, lng] = data.loc.split(',').map(Number);
                  const latlng = L.latLng(lat, lng);
                  currentPosition = latlng;
                  resolve(latlng);
                } else {
                  reject(new Error("Could not determine location"));
                }
              })
              .catch(err => {
                reject(err);
              });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }
    });
  };

  return {
    marker: locationMarker,
    circle: accuracyCircle,
    startTracking,
    stopTracking,
    getCurrentPosition
  };
};

// Calculate route between two points using Leaflet Routing Machine
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
