
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

interface RouteSearchProps {
  onSearch: (start: string, end: string) => void;
}

const RouteSearch: React.FC<RouteSearchProps> = ({ onSearch }) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!endLocation) {
      toast.error("Please enter a destination");
      return;
    }
    
    setIsSearching(true);

    try {
      // Call the exposed function from Map component with a small delay
      // to ensure the map is fully initialized
      setTimeout(() => {
        if (window && (window as any).calculateMapRoute) {
          console.log("Calling calculateMapRoute with:", startLocation, endLocation);
          (window as any).calculateMapRoute(startLocation, endLocation);
        } else {
          console.error("calculateMapRoute function not found on window object");
          toast.error("Navigation service not available");
        }
        
        // Call the provided onSearch callback as well
        onSearch(startLocation, endLocation);
        
        // Reset searching state
        setIsSearching(false);
      }, 300);
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error("Error calculating route. Please try again.");
      setIsSearching(false);
    }
  };

  return (
    <Card className="absolute top-20 left-0 right-0 mx-4 md:mx-auto md:max-w-md shadow-lg z-10">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              id="start"
              placeholder="Starting point (leave empty for current location)"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              id="destination"
              placeholder="Enter destination"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <Button 
            className="w-full bg-empowerher-primary hover:bg-empowerher-dark"
            onClick={handleSearch}
            disabled={!endLocation || isSearching}
          >
            {isSearching ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Finding route...
              </span>
            ) : (
              <span className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                Get Route
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteSearch;
