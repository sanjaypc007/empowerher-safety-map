
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

// Initialize Resend with the API key
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey);

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SOSRequestBody {
  userName: string;
  contactName: string;
  contactEmail: string;
  locationLink?: string;
  locationName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const body: SOSRequestBody = await req.json();
    const { userName, contactName, contactEmail, locationLink, locationName } = body;

    if (!contactEmail) {
      return new Response(
        JSON.stringify({ error: "Contact email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format the location information
    let locationInfo = "Location information is not available.";
    if (locationLink) {
      locationInfo = `<p>Their current location: <a href="${locationLink}" target="_blank">View on Google Maps</a></p>`;
    } else if (locationName) {
      locationInfo = `<p>Their last known location: ${locationName}</p>`;
    }

    // Send the email
    const { data, error } = await resend.emails.send({
      from: "EmpowerHer SOS <onboarding@resend.dev>",
      to: contactEmail,
      subject: `URGENT: ${userName || 'Someone'} needs your help!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #d9534f; text-align: center;">EMERGENCY SOS ALERT</h1>
          <p style="font-size: 16px;"><strong>${userName || 'Someone'}</strong> has triggered an SOS alert and needs your immediate assistance!</p>
          ${locationInfo}
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0;"><strong>Please take immediate action:</strong></p>
            <ul>
              <li>Try to contact them immediately</li>
              <li>If you cannot reach them, consider contacting local emergency services</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">This is an automated emergency alert sent via the EmpowerHer safety app.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
