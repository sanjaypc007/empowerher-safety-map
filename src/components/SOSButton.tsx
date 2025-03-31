
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, UserCheck, AlertTriangle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User, EmergencyContact } from "@/types";

interface SOSButtonProps {
  user: User;
}

const SOSButton: React.FC<SOSButtonProps> = ({ user }) => {
  const [isSending, setIsSending] = useState(false);
  const [sentSOS, setSentSOS] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch emergency contacts from Supabase
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setEmergencyContacts(data || []);
      } catch (error) {
        console.error("Error fetching emergency contacts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContacts();
  }, [user.id]);

  const handleSOSClick = () => {
    if (sentSOS) return;
    
    setIsSending(true);
    
    // Simulate SOS sending
    setTimeout(() => {
      setIsSending(false);
      setSentSOS(true);
      
      toast.success("SOS sent successfully to your emergency contacts", {
        description: "They have been notified of your location",
        duration: 5000,
      });
      
      // Reset after 30 seconds
      setTimeout(() => {
        setSentSOS(false);
      }, 30000);
    }, 2000);
  };

  const handleCallContact = (phoneNumber: string) => {
    // Make a phone call using the system dialer
    window.location.href = `tel:${phoneNumber}`;
  };
  
  const handleTextContact = (phoneNumber: string) => {
    // Send a pre-filled SMS
    const message = "I need help! Please check my location using EmpowerHer app.";
    window.location.href = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 pt-16 pb-4">
      <Card className="w-full max-w-md mb-8">
        <CardHeader>
          <CardTitle className="text-center text-lg">Emergency SOS</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center mb-6">
            Press the SOS button to alert your emergency contacts with your current location
          </p>
          
          <div className="flex justify-center mb-8">
            <Button
              variant="destructive"
              size="lg"
              className={`w-40 h-40 rounded-full transition-all duration-300 ${
                sentSOS ? "bg-green-600" : "bg-empowerher-red"
              } ${isSending ? "animate-pulse-gentle scale-95" : "scale-100"}`}
              onClick={handleSOSClick}
              disabled={isSending}
            >
              {sentSOS ? (
                <div className="flex flex-col items-center">
                  <UserCheck className="w-12 h-12 mb-2" />
                  <span className="text-sm">SOS Sent</span>
                </div>
              ) : isSending ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mb-2"></div>
                  <span className="text-sm">Sending...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <AlertTriangle className="w-12 h-12 mb-2" />
                  <span className="text-sm">SOS</span>
                </div>
              )}
            </Button>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="font-medium text-center mb-4">Your Emergency Contacts</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-empowerher-primary"></div>
              </div>
            ) : emergencyContacts.length > 0 ? (
              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center p-3 border rounded-lg">
                    <div className="flex-grow">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.relation} • {contact.phone}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleCallContact(contact.phone)}
                        aria-label={`Call ${contact.name}`}
                      >
                        <Phone className="h-4 w-4 text-empowerher-primary" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleTextContact(contact.phone)}
                        aria-label={`Text ${contact.name}`}
                      >
                        <MessageSquare className="h-4 w-4 text-empowerher-primary" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No emergency contacts added yet</p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.hash = "/add-contact"}
                  className="bg-empowerher-primary text-white hover:bg-empowerher-dark"
                >
                  Add Emergency Contact
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SOSButton;
