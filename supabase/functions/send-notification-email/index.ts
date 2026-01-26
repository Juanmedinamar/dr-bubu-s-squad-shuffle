import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  name: string;
  email: string;
  message: string; // Personalized message per recipient
}

interface NotificationRequest {
  recipients: Recipient[];
  subject: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification-email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject }: NotificationRequest = await req.json();
    
    console.log(`Sending email to ${recipients.length} recipients`);

    // Validate required fields
    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients provided");
    }

    if (!subject) {
      throw new Error("Subject is required");
    }

    const results = [];
    const errors = [];

    // Send emails to each recipient
    for (const recipient of recipients) {
      if (!recipient.email) {
        console.log(`Skipping ${recipient.name}: no email address`);
        errors.push({ name: recipient.name, error: "No email address" });
        continue;
      }

      try {
        // Convert message to HTML (preserve line breaks and formatting)
        const htmlMessage = recipient.message
          .replace(/\n/g, '<br>')
          .replace(/\*([^*]+)\*/g, '<strong>$1</strong>'); // Bold markdown

        const emailResponse = await resend.emails.send({
          from: "Dr. Bubu <onboarding@resend.dev>", // Use verified domain in production
          to: [recipient.email],
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="color: #333; line-height: 1.6;">
                ${htmlMessage}
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #888; font-size: 12px;">
                Este es un mensaje automático del sistema de planificación Dr. Bubu.
              </p>
            </div>
          `,
        });

        console.log(`Email sent successfully to ${recipient.email}:`, emailResponse);
        results.push({ name: recipient.name, email: recipient.email, success: true });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        errors.push({ name: recipient.name, email: recipient.email, error: emailError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: results.length, 
        failed: errors.length,
        results,
        errors 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
