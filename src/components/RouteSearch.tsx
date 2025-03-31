
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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

    // Call the exposed function from Map component
    if (window && (window as any).calculateMapRoute) {
      (window as any).calculateMapRoute(startLocation, endLocation);
    }
    
    // Call the provided onSearch callback as well
    onSearch(startLocation, endLocation);
    
    // Reset searching state after a delay to simulate processing
    setTimeout(() => {
      setIsSearching(false);
    }, 1500);
  };

  return (
    <Card className="absolute top-20 left-0 right-0 mx-4 shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="start" className="text-sm font-medium mb-1 block">
              Starting Point
            </label>
            <Input
              id="start"
              placeholder="Leave empty for current location"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="destination" className="text-sm font-medium mb-1 block">
              Destination
            </label>
            <Input
              id="destination"
              placeholder="Enter destination"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
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
                Searching...
              </span>
            ) : (
              <span className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                Find Safest Route
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteSearch;
