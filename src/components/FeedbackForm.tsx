import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const incidentTypes = [
  { value: "harassment", label: "Harassment" },
  { value: "poor_lighting", label: "Poor Lighting" },
  { value: "suspicious_activity", label: "Suspicious Activity" },
  { value: "verbal_abuse", label: "Verbal Abuse" },
  { value: "other", label: "Other" },
];

interface FeedbackFormProps {
  initialLocation?: string;
  initialDestination?: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ 
  initialLocation = "", 
  initialDestination = "" 
}) => {
  const [rating, setRating] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState(initialLocation);
  const [destination, setDestination] = useState(initialDestination);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating || !location) {
      toast.error("Please provide a rating and location");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success("Thank you for your feedback!", {
        description: "Your report will help keep others safe",
      });
      
      // Reset form
      setRating(null);
      setIncidentType("");
      setDescription("");
      setLocation("");
      setDestination("");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center pt-16 pb-4 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Report Safety Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="location">Starting Location</Label>
              <Input 
                id="location" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="Where did your journey start?"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input 
                id="destination" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                placeholder="Where did your journey end?"
                required
              />
            </div>
            
            <div className="space-y-3">
              <Label>How safe did you feel?</Label>
              <RadioGroup value={rating || ""} onValueChange={setRating} className="flex justify-between">
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex flex-col items-center">
                    <RadioGroupItem value={value.toString()} id={`rating-${value}`} className="sr-only" />
                    <Label
                      htmlFor={`rating-${value}`}
                      className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                        rating === value.toString()
                          ? value <= 2
                            ? "bg-empowerher-red text-white"
                            : value === 3
                            ? "bg-empowerher-yellow text-white"
                            : "bg-empowerher-green text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {value}
                    </Label>
                    <span className="text-xs mt-1">
                      {value === 1 ? "Very Unsafe" : value === 5 ? "Very Safe" : ""}
                    </span>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="incident-type">Incident Type (Optional)</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger id="incident-type">
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what happened..."
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-empowerher-primary hover:bg-empowerher-dark"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Submitting...
                </span>
              ) : (
                "Submit Report"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackForm;
