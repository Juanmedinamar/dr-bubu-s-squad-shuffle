import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  recipients: {
    name: string;
    email: string;
  }[];
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification-email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, message }: NotificationRequest = await req.json();
    
    console.log(`Sending email to ${recipients.length} recipients`);

    // Validate required fields
    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients provided");
    }

    if (!subject || !message) {
      throw new Error("Subject and message are required");
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
        const emailResponse = await resend.emails.send({
          from: "Dr. Bubu <onboarding@resend.dev>", // Use verified domain in production
          to: [recipient.email],
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Hola ${recipient.name},</h2>
              <div style="white-space: pre-wrap; color: #555; line-height: 1.6;">
${message}
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #888; font-size: 12px;">
                Este es un mensaje automático del sistema de planificación.
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
