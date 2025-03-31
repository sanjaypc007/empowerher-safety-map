
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@/types";

// Define the EmergencyContact interface to match the table structure
interface EmergencyContact {
  user_id: string;
  name: string;
  phone: string;
  relation?: string;
}

interface EmergencyContactFormProps {
  user: User;
  onSubmit: () => void;
}

const EmergencyContactForm: React.FC<EmergencyContactFormProps> = ({ user, onSubmit }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Ensure user ID is in the correct UUID format
      // We insert each field directly to avoid potential UUID format issues
      const { error } = await supabase
        .from("emergency_contacts")
        .insert({
          user_id: user.id,
          name,
          phone,
          relation: relation || null
        });
        
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      toast.success("Emergency contact added successfully");
      onSubmit();
      // Clear fields after successful submission
      setName("");
      setPhone("");
      setRelation("");
    } catch (err: any) {
      console.error("Error saving emergency contact:", err);
      toast.error(`Failed to save emergency contact: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to trigger a call using the tel: protocol
  const handleCall = () => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Add Emergency Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Contact Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="Enter phone number"
              type="tel"
              required
            />
            {phone && (
              <div className="flex items-center space-x-4 mt-2">
                {/* Clickable phone number link */}
                <a 
                  href={`tel:${phone}`} 
                  className="text-blue-500 hover:underline"
                >
                  {phone}
                </a>
                {/* Call button that opens the system dialer */}
                <Button 
                  type="button" 
                  onClick={handleCall}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Call
                </Button>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="relation">Relationship</Label>
            <Input 
              id="relation" 
              value={relation} 
              onChange={(e) => setRelation(e.target.value)} 
              placeholder="E.g. Parent, Friend, Sibling"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-empowerher-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </span>
            ) : "Save Emergency Contact"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmergencyContactForm;
