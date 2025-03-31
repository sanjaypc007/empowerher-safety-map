
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Map from "@/components/Map";
import RouteSearch from "@/components/RouteSearch";
import SOSButton from "@/components/SOSButton";
import FeedbackForm from "@/components/FeedbackForm";
import Auth from "@/components/Auth";
import { User } from "@/types";
import { toast } from "sonner";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("map");
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  useEffect(() => {
    // Simulate checking for existing user
    const timer = setTimeout(() => {
      setIsAuthChecking(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleRouteSearch = (start: string, end: string) => {
    // This toast will show when the route search is triggered
    // The actual route calculation is now handled in the Map component
    toast.success("Finding safest route", {
      description: start 
        ? `Calculating route from ${start} to ${end}`
        : `Calculating route from your location to ${end}`,
    });
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-empowerher-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="pb-16">
        {activeTab === "map" && (
          <>
            <Map />
            <RouteSearch onSearch={handleRouteSearch} />
          </>
        )}
        
        {activeTab === "sos" && <SOSButton />}
        
        {activeTab === "reports" && <FeedbackForm />}
      </main>
    </div>
  );
};

export default Index;
