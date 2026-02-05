 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
 // @deno-types="https://esm.sh/v135/jspdf@2.5.1/types/index.d.ts"
 import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const SPECIALTIES: Record<string, string> = {
   general: 'General',
   cardiac: 'Cardiología',
   neuro: 'Neurología',
   pediatric: 'Pediatría',
   trauma: 'Traumatología',
   orthopedic: 'Ortopedia',
   oncology: 'Oncología',
   vascular: 'Vascular',
   urology: 'Urología',
   gynecology: 'Ginecología',
 };
 
 const MONTHS = [
   'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
 ];
 
 function formatDuration(minutes: number): string {
   const hours = Math.floor(minutes / 60);
   const mins = minutes % 60;
   return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
 }
 
 function formatShift(shift: string): string {
   return shift === 'morning' ? 'Mañana' : 'Tarde';
 }
 
 function formatDate(dateStr: string): string {
   const date = new Date(dateStr + 'T00:00:00');
   return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
 }
 
 interface MonthlySummaryRequest {
   year: number;
   month: number;
 }
 
 const handler = async (req: Request): Promise<Response> => {
   console.log("generate-monthly-summary-pdf function called");
 
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
 
     // Check user role
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
       console.warn(`User ${userId} with role ${roleData.role} attempted unauthorized access`);
       return new Response(
         JSON.stringify({ error: 'Permisos insuficientes' }),
         { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     const { year, month }: MonthlySummaryRequest = await req.json();
     
     if (!year || !month || month < 1 || month > 12) {
       return new Response(
         JSON.stringify({ error: 'Año y mes inválidos' }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     console.log(`Generating monthly summary PDF for ${month}/${year}`);
 
     // Fetch data
     const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
     const lastDay = new Date(year, month, 0).getDate();
     const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
 
     const { data: operations, error: opError } = await supabase
       .from('operations')
       .select('*')
       .gte('date', startDate)
       .lte('date', endDate);
     if (opError) throw opError;
 
     const { data: opAssignments, error: oaError } = await supabase
       .from('operation_assignments')
       .select('*');
     if (oaError) throw oaError;
 
     const { data: members, error: mError } = await supabase
       .from('team_members')
       .select('*')
       .order('name');
     if (mError) throw mError;
 
     const { data: centers, error: cError } = await supabase
       .from('centers')
       .select('*');
     if (cError) throw cError;
 
     // Build summary per member
     const memberSummary = members.map((member: any) => {
       const memberOps = opAssignments
         .filter((oa: any) => oa.member_id === member.id)
         .map((oa: any) => operations.find((op: any) => op.id === oa.operation_id))
         .filter(Boolean);
 
       const totalOperations = memberOps.length;
       const totalDuration = memberOps.reduce((sum: number, op: any) => sum + (op?.estimated_duration || 0), 0);
       
       const bySpecialty = memberOps.reduce((acc: any, op: any) => {
         acc[op.specialty] = (acc[op.specialty] || 0) + 1;
         return acc;
       }, {});
 
       const byCenter = memberOps.reduce((acc: any, op: any) => {
         const center = centers.find((c: any) => c.id === op.center_id);
         const centerName = center?.name || 'Desconocido';
         acc[centerName] = (acc[centerName] || 0) + 1;
         return acc;
       }, {});
 
       return {
         id: member.id,
         name: member.name,
         role: member.role,
         totalOperations,
         totalDurationMinutes: totalDuration,
         bySpecialty,
         byCenter,
         operations: memberOps
           .map((op: any) => ({
             date: op.date,
             shift: op.shift,
             specialty: op.specialty,
             duration: op.estimated_duration,
             centerName: centers.find((c: any) => c.id === op.center_id)?.name || 'Desconocido',
           }))
           .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
       };
     });
 
     const anesthetists = memberSummary.filter((m: any) => m.role === 'anesthetist');
     const nurses = memberSummary.filter((m: any) => m.role === 'nurse');
 
     // Generate PDF
     const doc = new jsPDF();
     const pageWidth = doc.internal.pageSize.getWidth();
     const pageHeight = 280;
     const marginLeft = 15;
     const lineHeight = 5;
     let yPos = 20;
 
     const checkNewPage = (requiredSpace: number = 20) => {
       if (yPos > pageHeight - requiredSpace) {
         doc.addPage();
         yPos = 20;
       }
     };
 
     // Title
     doc.setFontSize(20);
     doc.setFont("helvetica", "bold");
     doc.text("Resumen Mensual de Operaciones", pageWidth / 2, yPos, { align: "center" });
     yPos += 10;
 
     doc.setFontSize(14);
     doc.setFont("helvetica", "normal");
     doc.text(`${MONTHS[month - 1]} ${year}`, pageWidth / 2, yPos, { align: "center" });
     yPos += 15;
 
     // Summary stats
     doc.setFontSize(11);
     doc.setFont("helvetica", "bold");
     doc.text("Resumen General", marginLeft, yPos);
     yPos += lineHeight + 2;
 
     doc.setFont("helvetica", "normal");
     doc.setFontSize(10);
     doc.text(`Total de operaciones: ${operations.length}`, marginLeft + 5, yPos);
     yPos += lineHeight;
     doc.text(`Anestesistas activos: ${anesthetists.filter((m: any) => m.totalOperations > 0).length} de ${anesthetists.length}`, marginLeft + 5, yPos);
     yPos += lineHeight;
     doc.text(`Enfermeros/as activos: ${nurses.filter((m: any) => m.totalOperations > 0).length} de ${nurses.length}`, marginLeft + 5, yPos);
     yPos += 10;
 
     // Function to render member section
     const renderMemberSection = (memberList: any[], title: string) => {
       checkNewPage(30);
       
       doc.setFontSize(14);
       doc.setFont("helvetica", "bold");
       doc.text(title, marginLeft, yPos);
       yPos += lineHeight + 3;
 
       for (const member of memberList) {
         checkNewPage(25);
 
         // Member name and totals
         doc.setFontSize(11);
         doc.setFont("helvetica", "bold");
         doc.text(member.name, marginLeft, yPos);
         yPos += lineHeight;
 
         doc.setFont("helvetica", "normal");
         doc.setFontSize(9);
         
         if (member.totalOperations === 0) {
           doc.text("Sin actividad este mes", marginLeft + 5, yPos);
           yPos += lineHeight + 3;
           continue;
         }
 
         doc.text(`Operaciones: ${member.totalOperations} | Tiempo total: ${formatDuration(member.totalDurationMinutes)}`, marginLeft + 5, yPos);
         yPos += lineHeight;
 
         // Centers summary
         const centersList = Object.entries(member.byCenter).map(([c, n]) => `${c}: ${n}`).join(', ');
         if (centersList) {
           doc.text(`Centros: ${centersList}`, marginLeft + 5, yPos);
           yPos += lineHeight;
         }
 
         // Specialties summary
         const specList = Object.entries(member.bySpecialty)
           .map(([s, n]) => `${SPECIALTIES[s] || s}: ${n}`)
           .join(', ');
         if (specList) {
           doc.text(`Especialidades: ${specList}`, marginLeft + 5, yPos);
           yPos += lineHeight;
         }
 
         // Detailed operations
         if (member.operations.length > 0) {
           yPos += 2;
           doc.setFontSize(8);
           doc.setFont("helvetica", "italic");
           doc.text("Detalle de operaciones:", marginLeft + 5, yPos);
           yPos += lineHeight - 1;
 
           doc.setFont("helvetica", "normal");
           for (const op of member.operations) {
             checkNewPage(8);
             const opLine = `${formatDate(op.date)} - ${formatShift(op.shift)} - ${op.centerName} - ${SPECIALTIES[op.specialty] || op.specialty} (${formatDuration(op.duration)})`;
             doc.text(`• ${opLine}`, marginLeft + 10, yPos);
             yPos += lineHeight - 1;
           }
         }
 
         yPos += 5;
       }
     };
 
     // Render anesthetists
     renderMemberSection(anesthetists, "Anestesistas");
     yPos += 5;
 
     // Render nurses
     renderMemberSection(nurses, "Enfermeros/as");
 
     // Footer on last page
     doc.setFontSize(8);
     doc.setTextColor(128, 128, 128);
     doc.text(`Generado por Dr. Bubu - ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 290, { align: "center" });
 
     const pdfOutput = doc.output('datauristring');
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         pdf: pdfOutput,
         filename: `resumen-mensual-${year}-${String(month).padStart(2, '0')}.pdf`
       }),
       {
         status: 200,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   } catch (error: any) {
     console.error("Error generating PDF:", {
       message: error.message,
       stack: error.stack,
       timestamp: new Date().toISOString()
     });
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