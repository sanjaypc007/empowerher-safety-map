
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Map from "@/components/Map";
import RouteSearch from "@/components/RouteSearch";
import SOSButton from "@/components/SOSButton";
import FeedbackForm from "@/components/FeedbackForm";
import EmergencyContactForm from "@/components/EmergencyContactForm";
import Auth from "@/components/Auth";
import { User } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("map");
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [hasEmergencyContact, setHasEmergencyContact] = useState<boolean>(false);

  useEffect(() => {
    // Simulate checking for existing user
    const timer = setTimeout(() => {
      setIsAuthChecking(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if user has emergency contacts
    if (user) {
      const checkEmergencyContacts = async () => {
        try {
          const { data, error } = await supabase
            .from('emergency_contacts')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
            
          if (error) throw error;
          
          setHasEmergencyContact(data && data.length > 0);
        } catch (error) {
          console.error("Error checking emergency contacts:", error);
        }
      };
      
      checkEmergencyContacts();
    }
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleRouteSearch = (start: string, end: string) => {
    // Check if user has emergency contacts before navigation
    if (!hasEmergencyContact && activeTab === "map") {
      toast.info("Please add an emergency contact first", {
        description: "For your safety, we recommend adding at least one emergency contact",
        action: {
          label: "Add Now",
          onClick: () => setShowAddContact(true),
        },
      });
      return;
    }
    
    // This toast will show when the route search is triggered
    // The actual route calculation is now handled in the Map component
    toast.success("Finding safest route", {
      description: start 
        ? `Calculating route from ${start} to ${end}`
        : `Calculating route from your location to ${end}`,
    });
  };

  const handleContactAdded = () => {
    setShowAddContact(false);
    setHasEmergencyContact(true);
    toast.success("Emergency contact added");
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

  if (showAddContact) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="container mx-auto px-4 py-8">
          <EmergencyContactForm 
            user={user} 
            onSubmit={handleContactAdded} 
          />
        </div>
      </div>
    );
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
        
        {activeTab === "sos" && <SOSButton user={user} />}
        
        {activeTab === "reports" && <FeedbackForm />}
      </main>
    </div>
  );
};

export default Index;
