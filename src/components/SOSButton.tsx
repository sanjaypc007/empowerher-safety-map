import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, UserCheck, AlertTriangle, Mail, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    relation: ""
  });

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

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          
          // Try to get a human-readable location name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
            );
            const data = await response.json();
            if (data && data.display_name) {
              setLocationName(data.display_name);
            }
          } catch (error) {
            console.error("Error getting location name:", error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, []);

  const sendEmergencyEmail = async (contactEmail: string, contactName: string) => {
    try {
      // Create location link for Google Maps if we have coordinates
      const locationLink = userLocation 
        ? `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}` 
        : undefined;
      
      const response = await supabase.functions.invoke('send-sos-email', {
        body: {
          userName: user.name || 'User',
          contactName,
          contactEmail,
          locationLink,
          locationName
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to send SOS email');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending SOS email:', error);
      return false;
    }
  };

  const handleSOSClick = () => {
    if (sentSOS) return;
    
    setIsSending(true);
    
    // Simulate SOS sending and also send emails
    setTimeout(async () => {
      let emailSuccessCount = 0;
      let emailFailCount = 0;
      
      // If we have contacts, send emails
      if (emergencyContacts.length > 0) {
        const emailPromises = emergencyContacts.map(async (contact) => {
          const success = await sendEmergencyEmail(contact.email, contact.name);
          if (success) {
            emailSuccessCount++;
          } else {
            emailFailCount++;
          }
        });
        
        // Wait for all emails to be sent
        await Promise.all(emailPromises);
        
        if (emailSuccessCount > 0) {
          toast.success(`SOS emails sent to ${emailSuccessCount} contact${emailSuccessCount > 1 ? 's' : ''}`, {
            description: "They have been notified of your situation",
            duration: 5000,
          });
        }
        
        if (emailFailCount > 0) {
          toast.error(`Failed to send ${emailFailCount} email${emailFailCount > 1 ? 's' : ''}`, {
            description: "Please try calling your contacts directly",
            duration: 5000,
          });
        }
      } else {
        toast.info("No emergency contacts to notify", {
          description: "Please add contacts for SOS notifications",
          duration: 5000,
        });
      }
      
      setIsSending(false);
      setSentSOS(true);
      
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
  
  const handleEmailContact = (email: string, contactName: string) => {
    // Send SOS email
    sendEmergencyEmail(email, contactName);
    toast.success(`SOS email sent to ${contactName}`, {
      description: "Email has been sent with your location information",
    });
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.email) {
      toast.error("Name, phone number, and email are required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          name: newContact.name,
          phone: newContact.phone,
          email: newContact.email,
          relation: newContact.relation || null
        })
        .select();
        
      if (error) throw error;
      
      toast.success("Emergency contact added successfully");
      
      // Reset form and close dialog
      setNewContact({ name: "", phone: "", email: "", relation: "" });
      setShowAddContactDialog(false);
      
      // Update the contacts list with the new contact
      if (data && data.length > 0) {
        setEmergencyContacts([...emergencyContacts, data[0]]);
      } else {
        // Refresh the entire list if we didn't get the newly created contact back
        const { data: refreshedData } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', user.id);
          
        if (refreshedData) {
          setEmergencyContacts(refreshedData);
        }
      }
    } catch (error: any) {
      console.error("Error adding emergency contact:", error);
      toast.error(error.message || "Failed to add emergency contact");
    }
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Your Emergency Contacts</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddContactDialog(true)}
                className="flex items-center text-xs"
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                Add Contact
              </Button>
            </div>
            
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
                      <p className="text-sm text-gray-500">{contact.email}</p>
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
                        onClick={() => handleEmailContact(contact.email, contact.name)}
                        aria-label={`Email ${contact.name}`}
                      >
                        <Mail className="h-4 w-4 text-empowerher-primary" />
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
                  onClick={() => setShowAddContactDialog(true)}
                  className="bg-empowerher-primary text-white hover:bg-empowerher-dark"
                >
                  Add Emergency Contact
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input 
                id="contact-name" 
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                placeholder="Contact name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number</Label>
              <Input 
                id="contact-phone" 
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                placeholder="Phone number"
                type="tel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input 
                id="contact-email" 
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                placeholder="Email address"
                type="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-relation">Relationship (Optional)</Label>
              <Input 
                id="contact-relation" 
                value={newContact.relation}
                onChange={(e) => setNewContact({...newContact, relation: e.target.value})}
                placeholder="E.g. Parent, Friend, Sibling"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddContactDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddContact}
              className="bg-empowerher-primary hover:bg-empowerher-dark"
            >
              Save Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SOSButton;
