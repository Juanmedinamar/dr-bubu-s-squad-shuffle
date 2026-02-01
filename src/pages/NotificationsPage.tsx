import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Users,
  FileText,
  ExternalLink,
  Download,
  Loader2
} from 'lucide-react';
import { useTeamMembers, useCenters, useAssignments } from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatMemberSchedule, getWeekDates } from '@/lib/scheduleFormatter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationsPage() {
  const { role } = useAuth();
  const { data: teamMembers = [], isLoading: loadingMembers } = useTeamMembers(role);
  const { data: centers = [], isLoading: loadingCenters } = useCenters();
  const { data: assignments = [], isLoading: loadingAssignments } = useAssignments();
  
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const isLoading = loadingMembers || loadingCenters || loadingAssignments;

  const weekDates = getWeekDates(0);
  const weekStart = weekDates[0].dateStr;
  const weekEnd = weekDates[6].dateStr;
  const weekLabel = `${format(weekDates[0].date, "d 'de' MMMM", { locale: es })} al ${format(weekDates[6].date, "d 'de' MMMM", { locale: es })}`;

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    if (selectedMembers.length === teamMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(teamMembers.map(m => m.id));
    }
  };

  const getPersonalizedMessage = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return '';
    
    const schedule = formatMemberSchedule(member, assignments, centers, 0);
    const greeting = customMessage || `Hola ${member.name.split(' ')[0]},\n\nTe enviamos tu planificación de turnos para la próxima semana.`;
    
    return `${greeting}\n\n${schedule}\n\nSaludos,\nEquipo del Dr. Bubu`;
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-schedule-pdf', {
        body: {
          teamMembers,
          centers,
          assignments,
          weekStart,
          weekEnd,
        },
      });

      if (error) throw error;

      // Download the PDF
      const link = document.createElement('a');
      link.href = data.pdf;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('PDF descargado correctamente');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF: ' + error.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Selecciona al menos un miembro del equipo');
      return;
    }

    setSending(true);
    
    try {
      const recipients = selectedMembers
        .map(id => {
          const member = teamMembers.find(m => m.id === id);
          if (!member || !member.email) return null;
          return { 
            name: member.name, 
            email: member.email,
            message: getPersonalizedMessage(id)
          };
        })
        .filter(Boolean);

      if (recipients.length === 0) {
        toast.error('Ninguno de los miembros seleccionados tiene email');
        setSending(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          recipients,
          subject: `Planificación semanal - ${weekLabel}`,
        },
      });

      if (error) throw error;

      toast.success(`Email enviado a ${data.sent} personas`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} emails fallaron`);
      }
      setSelectedMembers([]);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Error al enviar emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (selectedMembers.length === 0) {
      toast.error('Selecciona al menos un miembro del equipo');
      return;
    }

    const membersWithPhone = selectedMembers
      .map(id => teamMembers.find(m => m.id === id))
      .filter(m => m && m.phone);

    if (membersWithPhone.length === 0) {
      toast.error('Ninguno de los miembros seleccionados tiene teléfono');
      return;
    }

    membersWithPhone.forEach((member, index) => {
      const personalizedMessage = getPersonalizedMessage(member!.id);
      const messageText = encodeURIComponent(personalizedMessage);
      const phone = member!.phone!.replace(/[^\d+]/g, '').replace('+', '');
      const whatsappUrl = `https://wa.me/${phone}?text=${messageText}`;
      
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, index * 500);
    });

    toast.success(`Abriendo WhatsApp para ${membersWithPhone.length} personas`);
    setSelectedMembers([]);
  };

  // Preview the message for the first selected member
  const previewMemberId = selectedMembers[0];
  const previewMessage = previewMemberId ? getPersonalizedMessage(previewMemberId) : '';

  if (isLoading) {
    return (
      <MainLayout 
        title="Notificaciones" 
        subtitle="Envía la planificación al equipo"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Notificaciones" 
      subtitle="Envía la planificación al equipo"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message composer */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Planificación de la semana</CardTitle>
                  <CardDescription>
                    {weekLabel}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                >
                  {generatingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Descargar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mensaje personalizado (opcional)
                </label>
                <Textarea
                  placeholder="Deja vacío para usar el saludo predeterminado..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {previewMessage && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Vista previa del mensaje:
                  </p>
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {previewMessage}
                  </pre>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Cada miembro recibirá sus turnos específicos de la semana</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Método de envío</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="whatsapp">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="whatsapp" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="whatsapp" className="mt-4">
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-medium mb-2">Envío por WhatsApp</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Se abrirá WhatsApp Web con el mensaje personalizado incluyendo los turnos de cada miembro.
                    </p>
                    <Button 
                      onClick={handleSendWhatsApp} 
                      disabled={selectedMembers.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir WhatsApp ({selectedMembers.length} seleccionados)
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="email" className="mt-4">
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-medium mb-2">Envío por Email</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Se enviará un email personalizado a cada miembro con sus turnos asignados.
                    </p>
                    <Button 
                      onClick={handleSendEmail} 
                      disabled={sending || selectedMembers.length === 0}
                      className="w-full"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar por Email ({selectedMembers.length} seleccionados)
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Recipients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Destinatarios</CardTitle>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedMembers.length === teamMembers.length ? 'Deseleccionar' : 'Seleccionar todos'}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {selectedMembers.length} de {teamMembers.length} seleccionados
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {teamMembers.map((member) => {
                const isSelected = selectedMembers.includes(member.id);
                const memberAssignments = assignments.filter(a => a.memberId === member.id);
                
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => toggleMember(member.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn(
                        'text-xs text-white',
                        member.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
                      )}>
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {memberAssignments.length} turnos · {member.email || member.phone || 'Sin contacto'}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
