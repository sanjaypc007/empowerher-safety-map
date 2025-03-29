
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 py-2 px-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-empowerher-primary">EmpowerHer</h1>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-xs mx-auto">
          <TabsList className="grid grid-cols-3 w-full">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex flex-col items-center justify-center py-2",
                  activeTab === tab.value && "text-empowerher-primary"
                )}
              >
                {tab.icon}
                <span className="text-xs mt-1">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="w-8"></div> {/* Spacer to balance header */}
      </div>
    </header>
  );
};

export default Header;
