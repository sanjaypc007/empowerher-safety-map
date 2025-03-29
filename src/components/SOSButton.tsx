
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, UserCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const SOSButton: React.FC = () => {
  const [isSending, setIsSending] = useState(false);
  const [sentSOS, setSentSOS] = useState(false);

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
            <div className="space-y-3">
              <div className="flex items-center p-3 border rounded-lg">
                <Phone className="w-5 h-5 mr-3 text-empowerher-primary" />
                <div>
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-gray-500">Mother • (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center p-3 border rounded-lg">
                <Phone className="w-5 h-5 mr-3 text-empowerher-primary" />
                <div>
                  <p className="font-medium">Michael Wilson</p>
                  <p className="text-sm text-gray-500">Friend • (555) 987-6543</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SOSButton;
