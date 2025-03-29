
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RouteSegment, SafetyLevel } from "@/types";

// Mock data for safety zones
const mockSafetyZones = [
  {
    id: "1",
    latitude: 28.6139,
    longitude: 77.2090,
    radius: 500,
    safetyLevel: SafetyLevel.HIGH_RISK,
  },
  {
    id: "2",
    latitude: 28.6229,
    longitude: 77.2080,
    radius: 300,
    safetyLevel: SafetyLevel.MEDIUM_RISK,
  },
  {
    id: "3",
    latitude: 28.6339,
    longitude: 77.2190,
    radius: 400,
    safetyLevel: SafetyLevel.SAFE,
  },
];

// Mock data for route
const mockRoute: RouteSegment[] = [
  {
    id: "1",
    startLocation: { latitude: 28.6139, longitude: 77.2090, address: "Connaught Place" },
    endLocation: { latitude: 28.6229, longitude: 77.2080, address: "Janpath" },
    safetyLevel: SafetyLevel.HIGH_RISK,
    distance: 1.2,
  },
  {
    id: "2",
    startLocation: { latitude: 28.6229, longitude: 77.2080, address: "Janpath" },
    endLocation: { latitude: 28.6339, longitude: 77.2190, address: "India Gate" },
    safetyLevel: SafetyLevel.MEDIUM_RISK,
    distance: 2.5,
  },
  {
    id: "3",
    startLocation: { latitude: 28.6339, longitude: 77.2190, address: "India Gate" },
    endLocation: { latitude: 28.6129, longitude: 77.2295, address: "Destination" },
    safetyLevel: SafetyLevel.SAFE,
    distance: 1.8,
  },
];

const Map: React.FC = () => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // This would be replaced with actual map initialization in a real app
  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] mt-16">
      {/* Map placeholder */}
      <div className="w-full h-full bg-gray-100 relative">
        {!isMapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-empowerher-primary"></div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">Interactive Map would be displayed here</p>
              
              {/* Safety zones visualization */}
              <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full safety-zone-high"></div>
              <div className="absolute top-1/3 right-1/3 w-16 h-16 rounded-full safety-zone-medium"></div>
              <div className="absolute bottom-1/4 right-1/4 w-20 h-20 rounded-full safety-zone-safe"></div>
            </div>
          </>
        )}
      </div>

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
