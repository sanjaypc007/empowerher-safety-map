
import { useCallback } from 'react';
import L from 'leaflet';
import { toast } from "sonner";
import { colorRouteBasedOnSafety, geocodeAddress } from "@/utils/mapUtils";

interface RouteCalculatorProps {
  mapInstance: L.Map | null;
  userLocation: [number, number] | null;
  setRoutingControl: (control: any) => void;
  routingControl: any;
  setDirections: (directions: string[]) => void;
  setIsNavigating: (isNavigating: boolean) => void;
  setNavigationComplete: (isComplete: boolean) => void;
  setShowDirections: (show: boolean) => void;
}

export const useRouteCalculator = ({
  mapInstance,
  userLocation,
  setRoutingControl,
  routingControl,
  setDirections,
  setIsNavigating,
  setNavigationComplete,
  setShowDirections
}: RouteCalculatorProps) => {
  
  const calculateRoute = useCallback(async (start: string, end: string) => {
    if (!mapInstance) {
      toast.error("Map not initialized");
      return;
    }
    
    console.log("Calculating route from", start, "to", end);
    
    // Remove previous route if exists
    if (routingControl) {
      mapInstance.removeControl(routingControl);
    }
    
    let startCoords: [number, number];
    let endCoords: [number, number] | null;

    try {
      // Use current location if start is empty
      if (start === "") {
        if (userLocation) {
          startCoords = userLocation;
        } else {
          // Get current location if not already available
          startCoords = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve([position.coords.latitude, position.coords.longitude]),
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
      endCoords = await geocodeAddress(end);
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

      // Create routing control using OSRM service similar to the HTML example
      try {
        const control = L.Routing.control({
          waypoints: [
            L.latLng(startCoords[0], startCoords[1]),
            L.latLng(endCoords[0], endCoords[1])
          ],
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          }),
          lineOptions: {
            styles: [{ color: '#007bff', weight: 5 }], // Default color similar to HTML example
            addWaypoints: false, // Prevent waypoint addition on click
          },
          show: false, // Don't show the default instructions panel
          fitSelectedRoutes: true,
        }).addTo(mapInstance);

        // Get directions when route is found
        control.on('routesfound', function(e: any) {
          const routes = e.routes;
          const instructions = routes[0].instructions;
          setDirections(instructions.map((step: any) => step.text));
          
          // Color the route segments based on safety data
          colorRouteBasedOnSafety(control, routes[0], mapInstance);
        });

        setRoutingControl(control);
      } catch (error) {
        console.error("Error creating route:", error);
        toast.error("Error creating route. Please try again.");
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error(error instanceof Error ? error.message : "Error calculating route");
    }
  }, [mapInstance, userLocation, routingControl, setDirections, setIsNavigating, setNavigationComplete, setShowDirections]);

  return { calculateRoute };
};
