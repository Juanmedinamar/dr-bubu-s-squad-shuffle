import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @deno-types="https://esm.sh/v135/jspdf@2.5.1/types/index.d.ts"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const handler = async (req: Request): Promise<Response> => {
  console.log("generate-schedule-pdf function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamMembers, centers, assignments, weekStart, weekEnd }: ScheduleRequest = await req.json();
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
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
