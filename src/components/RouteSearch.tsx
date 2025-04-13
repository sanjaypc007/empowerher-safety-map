
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Navigation, Locate } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RouteSearchProps {
  onSearch: (start: string, end: string) => void;
}

const RouteSearch: React.FC<RouteSearchProps> = ({ onSearch }) => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyEmail, setEmergencyEmail] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user is logged in
  React.useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    };
    
    checkUser();
  }, []);

  const handleSearch = () => {
    if (!endLocation) {
      toast.error("Please enter a destination");
      return;
    }
    
    // Check if user has emergency contacts or show dialog
    const checkEmergencyContacts = async () => {
      if (!userId) {
        // If not logged in, proceed without checking
        proceedWithSearch();
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('emergency_contacts')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
          
        if (error) throw error;
        
        if (!data || data.length === 0) {
          // No emergency contacts found, show dialog
          setShowEmergencyDialog(true);
        } else {
          // Emergency contact exists, proceed with search
          proceedWithSearch();
        }
      } catch (error) {
        console.error("Error checking emergency contacts:", error);
        // Proceed anyway in case of error
        proceedWithSearch();
      }
    };
    
    checkEmergencyContacts();
  };

  const saveEmergencyContact = async () => {
    if (!userId) {
      toast.error("You must be logged in to save emergency contacts");
      proceedWithSearch();
      return;
    }
    
    if (!emergencyName || !emergencyPhone) {
      toast.error("Name and phone number are required");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .insert({
          user_id: userId,
          name: emergencyName,
          phone: emergencyPhone,
          email: emergencyEmail,
          relation: emergencyRelation || null
        });
        
      if (error) throw error;
      
      toast.success("Emergency contact saved");
      setShowEmergencyDialog(false);
      proceedWithSearch();
    } catch (error: any) {
      console.error("Error saving emergency contact:", error);
      toast.error(error.message || "Failed to save emergency contact");
    }
  };

  const proceedWithSearch = () => {
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

  const skipEmergencyContact = () => {
    setShowEmergencyDialog(false);
    proceedWithSearch();
  };

  return (
    <>
      <Card className="absolute top-20 left-0 right-0 mx-4 md:mx-auto md:max-w-md shadow-lg z-10">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Locate className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
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

      {/* Emergency Contact Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emergency-name" className="text-sm font-medium">Name</Label>
              <Input
                id="emergency-name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Contact name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency-phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="emergency-phone"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="Phone number"
                type="tel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency-email" className="text-sm font-medium">Email (Optional)</Label>
              <Input
                id="emergency-email"
                value={emergencyEmail}
                onChange={(e) => setEmergencyEmail(e.target.value)}
                placeholder="Email address"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency-relation" className="text-sm font-medium">Relationship (Optional)</Label>
              <Input
                id="emergency-relation"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                placeholder="E.g. Parent, Friend, Sibling"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={skipEmergencyContact}>Skip for now</Button>
            <Button 
              className="bg-empowerher-primary hover:bg-empowerher-dark"
              onClick={saveEmergencyContact}
            >
              Save & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RouteSearch;
