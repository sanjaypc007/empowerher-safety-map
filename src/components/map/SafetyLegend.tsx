
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const SafetyLegend: React.FC = () => {
  return (
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
  );
};

export default SafetyLegend;
