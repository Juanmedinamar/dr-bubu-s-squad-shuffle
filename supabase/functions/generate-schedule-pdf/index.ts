import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
// @deno-types="https://esm.sh/v135/jspdf@2.5.1/types/index.d.ts"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation helpers
function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function validateDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const parsed = new Date(date + 'T00:00:00');
  return !isNaN(parsed.getTime());
}

function validateString(str: string, maxLength: number): boolean {
  return typeof str === 'string' && str.length > 0 && str.length <= maxLength;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'anesthetist' | 'nurse';
}

interface Center {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  memberId: string;
  centerId: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'full';
}

interface ScheduleRequest {
  teamMembers: TeamMember[];
  centers: Center[];
  assignments: Assignment[];
  weekStart: string;
  weekEnd: string;
}

const SHIFTS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  full: 'Jornada completa',
};

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

function getWeekDates(weekStart: string): { dateStr: string; dayName: string }[] {
  const start = new Date(weekStart + 'T00:00:00');
  return DAYS_OF_WEEK.map((dayName, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      dateStr: date.toISOString().split('T')[0],
      dayName,
    };
  });
}

function validateRequest(data: ScheduleRequest): string | null {
  // Validate array limits
  if (!Array.isArray(data.teamMembers) || data.teamMembers.length > 100) {
    return 'teamMembers debe ser un array con máximo 100 elementos';
  }
  if (!Array.isArray(data.centers) || data.centers.length > 50) {
    return 'centers debe ser un array con máximo 50 elementos';
  }
  if (!Array.isArray(data.assignments) || data.assignments.length > 1000) {
    return 'assignments debe ser un array con máximo 1000 elementos';
  }

  // Validate dates
  if (!validateDate(data.weekStart)) {
    return 'weekStart debe ser una fecha válida (YYYY-MM-DD)';
  }
  if (!validateDate(data.weekEnd)) {
    return 'weekEnd debe ser una fecha válida (YYYY-MM-DD)';
  }

  // Validate team members
  for (const member of data.teamMembers) {
    if (!validateUUID(member.id)) {
      return `ID de miembro inválido: ${member.id}`;
    }
    if (!validateString(member.name, 100)) {
      return 'Nombre de miembro inválido o demasiado largo';
    }
    if (!['anesthetist', 'nurse'].includes(member.role)) {
      return `Rol de miembro inválido: ${member.role}`;
    }
  }

  // Validate centers
  for (const center of data.centers) {
    if (!validateUUID(center.id)) {
      return `ID de centro inválido: ${center.id}`;
    }
    if (!validateString(center.name, 100)) {
      return 'Nombre de centro inválido o demasiado largo';
    }
  }

  // Validate assignments
  for (const assignment of data.assignments) {
    if (!validateUUID(assignment.id)) {
      return `ID de asignación inválido: ${assignment.id}`;
    }
    if (!validateUUID(assignment.memberId)) {
      return `ID de miembro en asignación inválido: ${assignment.memberId}`;
    }
    if (!validateUUID(assignment.centerId)) {
      return `ID de centro en asignación inválido: ${assignment.centerId}`;
    }
    if (!validateDate(assignment.date)) {
      return `Fecha de asignación inválida: ${assignment.date}`;
    }
    if (!['morning', 'afternoon', 'full'].includes(assignment.shift)) {
      return `Turno de asignación inválido: ${assignment.shift}`;
    }
  }

  return null;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("generate-schedule-pdf function called");

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
      console.warn(`User ${userId} with role ${roleData.role} attempted unauthorized access to generate-schedule-pdf`);
      return new Response(
        JSON.stringify({ error: 'Permisos insuficientes' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`User ${userId} authorized with role: ${roleData.role}`);

    const requestData: ScheduleRequest = await req.json();
    
    // Validate input
    const validationError = validateRequest(requestData);
    if (validationError) {
      console.error("Validation error:", validationError);
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { teamMembers, centers, assignments, weekStart, weekEnd } = requestData;
    console.log(`Generating PDF for week ${weekStart} to ${weekEnd}, ${assignments.length} assignments`);

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Planificación Semanal", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Semana del ${formatDate(weekStart)} al ${formatDate(weekEnd)}`, 105, 30, { align: "center" });
    
    let yPos = 45;
    const pageHeight = 280;
    const lineHeight = 6;
    
    const weekDates = getWeekDates(weekStart);
    
    for (const { dateStr, dayName } of weekDates) {
      const dayAssignments = assignments.filter(a => a.date === dateStr);
      
      if (dayAssignments.length === 0) continue;
      
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      // Day header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${dayName} - ${formatDate(dateStr)}`, 15, yPos);
      yPos += lineHeight + 2;
      
      // Group by center
      const centerGroups = new Map<string, Assignment[]>();
      dayAssignments.forEach(a => {
        if (!centerGroups.has(a.centerId)) {
          centerGroups.set(a.centerId, []);
        }
        centerGroups.get(a.centerId)!.push(a);
      });
      
      for (const [centerId, centerAssignments] of centerGroups) {
        const center = centers.find(c => c.id === centerId);
        if (!center) continue;
        
        // Check if we need a new page
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`  ${center.name}`, 15, yPos);
        yPos += lineHeight;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        for (const assignment of centerAssignments) {
          const member = teamMembers.find(m => m.id === assignment.memberId);
          if (!member) continue;
          
          // Check if we need a new page
          if (yPos > pageHeight - 10) {
            doc.addPage();
            yPos = 20;
          }
          
          const role = member.role === 'anesthetist' ? 'Anestesista' : 'Enfermero/a';
          const shiftName = SHIFTS[assignment.shift];
          doc.text(`      • ${member.name} (${role}) - ${shiftName}`, 15, yPos);
          yPos += lineHeight;
        }
        yPos += 2;
      }
      yPos += 4;
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generado por Dr. Bubu - ${new Date().toLocaleDateString('es-ES')}`, 105, 290, { align: "center" });
    
    // Generate base64
    const pdfOutput = doc.output('datauristring');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: pdfOutput,
        filename: `planificacion-${weekStart}.pdf`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    // Log detailed error server-side for debugging
    console.error("Error generating PDF:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Error al generar el PDF. Por favor, inténtelo de nuevo.' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
