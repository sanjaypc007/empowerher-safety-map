
import { useCallback } from 'react';
import L from 'leaflet';
import { toast } from "sonner";
import { colorRouteBasedOnSafety, geocode } from "@/utils/mapUtils";

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
    if (!mapInstance) return;
    
    console.log("Calculating route from", start, "to", end);
    
    // Remove previous route if exists
    if (routingControl) {
      mapInstance.removeControl(routingControl);
    }
    
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

    console.log("Start coordinates:", startCoords);
    console.log("End coordinates:", endCoords);

    // Set navigation mode
    setIsNavigating(true);
    setNavigationComplete(false);
    
    // Show directions panel
    setShowDirections(true);

    // Create routing control
    try {
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
        colorRouteBasedOnSafety(control, routes[0], mapInstance);
      });

      setRoutingControl(control);
    } catch (error) {
      console.error("Error creating route:", error);
      toast.error("Error creating route. Please try again.");
    }
  }, [mapInstance, userLocation, routingControl, setDirections, setIsNavigating, setNavigationComplete, setShowDirections]);

  return { calculateRoute };
};
