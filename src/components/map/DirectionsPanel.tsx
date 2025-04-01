
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

interface DirectionsPanelProps {
  directions: string[];
  isNavigating: boolean;
  navigationComplete: boolean;
  showDirections: boolean;
  setShowDirections: (show: boolean) => void;
  completeNavigation: () => void;
}

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  directions,
  isNavigating,
  navigationComplete,
  showDirections,
  setShowDirections,
  completeNavigation
}) => {
  if (directions.length === 0) return null;

  return (
    <>
      <button 
        className="absolute bottom-4 right-4 px-4 py-2 bg-white rounded-md shadow-md z-10 text-sm flex items-center font-medium"
        onClick={() => setShowDirections(!showDirections)}
      >
        {showDirections ? (
          <>
            <ChevronDown className="w-4 h-4 mr-1" /> Hide Directions
          </>
        ) : (
          <>
            <ChevronUp className="w-4 h-4 mr-1" /> Show Directions
          </>
        )}
      </button>
      
      {showDirections && (
        <Card className="absolute bottom-16 right-4 w-[350px] max-h-[50vh] shadow-lg z-10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">Directions</h3>
              <span className="text-xs text-gray-500">{directions.length} steps</span>
            </div>
            <ScrollArea className="h-[calc(50vh-100px)]">
              <ul className="space-y-3">
                {directions.map((step, index) => (
                  <li key={index} className="flex py-2 border-b border-gray-100 last:border-b-0">
                    <span className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 text-xs font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            
            {isNavigating && !navigationComplete && (
              <Button 
                className="w-full mt-4 bg-empowerher-primary hover:bg-empowerher-dark"
                onClick={completeNavigation}
              >
                <Check className="mr-2 h-4 w-4" />
                Complete Navigation
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default DirectionsPanel;
