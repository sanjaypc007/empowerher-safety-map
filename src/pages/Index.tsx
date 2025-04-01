
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
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || "User",
          });
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsAuthChecking(false);
      }
    };
    
    checkUser();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || "User",
          });
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
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
    if (!hasEmergencyContact && user) {
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
          <div className="mt-4 text-center">
            <button 
              onClick={() => setShowAddContact(false)}
              className="text-empowerher-primary hover:underline"
            >
              Go back
            </button>
          </div>
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
