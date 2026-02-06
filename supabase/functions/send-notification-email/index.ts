import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation schemas (manual since zod isn't easily importable in Deno edge functions)
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validateString(str: string, maxLength: number): boolean {
  return typeof str === 'string' && str.length > 0 && str.length <= maxLength;
}

// Escape HTML entities to prevent XSS - converts all user input to safe text
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Apply markdown-like formatting AFTER escaping (safe: works on escaped text)
function formatMessage(escapedText: string): string {
  return escapedText
    .replace(/\n/g, '<br>')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
}

interface Recipient {
  name: string;
  email: string;
  message: string;
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
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error("Invalid token:", claimsError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.user.id;
    console.log("Authenticated user:", userId);

    // Check user role - require staff or admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !roleData) {
      console.error('Failed to fetch user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (roleData.role !== 'admin' && roleData.role !== 'staff') {
      console.warn(`User ${userId} with role ${roleData.role} attempted unauthorized access to send-notification-email`);
      return new Response(
        JSON.stringify({ error: 'Permisos insuficientes' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`User ${userId} authorized with role: ${roleData.role}`);

    const requestData = await req.json();
    const { recipients, subject }: NotificationRequest = requestData;
    
    // Input validation
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Se requiere al menos un destinatario' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (recipients.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Máximo 50 destinatarios por envío' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateString(subject, 200)) {
      return new Response(
        JSON.stringify({ error: 'El asunto debe tener entre 1 y 200 caracteres' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for header injection in subject
    if (subject.includes('\n') || subject.includes('\r')) {
      return new Response(
        JSON.stringify({ error: 'El asunto no puede contener saltos de línea' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending email to ${recipients.length} recipients`);

    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      // Validate each recipient
      if (!validateString(recipient.name, 100)) {
        errors.push({ name: recipient.name || 'Unknown', error: 'Nombre inválido' });
        continue;
      }

      if (!recipient.email || !validateEmail(recipient.email)) {
        console.log(`Skipping ${recipient.name}: invalid email address`);
        errors.push({ name: recipient.name, error: 'Dirección de email inválida' });
        continue;
      }

      if (!validateString(recipient.message, 5000)) {
        errors.push({ name: recipient.name, error: 'Mensaje inválido o demasiado largo' });
        continue;
      }

      try {
        // Escape HTML to prevent XSS, then apply safe formatting
        const escapedMessage = escapeHtml(recipient.message);
        const htmlMessage = formatMessage(escapedMessage);

        const emailResponse = await resend.emails.send({
          from: "Dr. Bubu <onboarding@resend.dev>",
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
    // Log detailed error server-side for debugging
    console.error("Error in send-notification-email function:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Error al procesar la solicitud. Por favor, inténtelo de nuevo.' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
