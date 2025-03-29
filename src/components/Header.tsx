
import React from "react";
import { Bell, MapPin, Shield } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { TabItem } from "@/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  
  const tabs: TabItem[] = [
    {
      label: "Map",
      value: "map",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      label: "SOS",
      value: "sos",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      label: "Reports",
      value: "reports",
      icon: <Bell className="h-5 w-5" />,
    },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100 py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-empowerher-primary to-empowerher-dark bg-clip-text text-transparent">
            EmpowerHer
          </h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
          <TabsList className="grid grid-cols-3 h-10 gap-1 px-1 min-w-[240px]">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 rounded-md transition-all",
                  activeTab === tab.value 
                    ? "bg-empowerher-light text-empowerher-primary shadow-sm" 
                    : "hover:bg-gray-50"
                )}
              >
                {tab.icon}
                <span className="text-xs mt-0.5 font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        <div className="w-[120px] flex justify-end">
          <button className="w-8 h-8 rounded-full bg-empowerher-light flex items-center justify-center">
            <span className="text-sm font-medium text-empowerher-primary">
              {/* User initial */}
              U
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
