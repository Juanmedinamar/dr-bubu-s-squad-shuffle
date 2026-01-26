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
  ExternalLink
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function NotificationsPage() {
  const { teamMembers } = useData();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

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

  const getMessageContent = () => message || defaultMessage;

  const handleSendEmail = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Selecciona al menos un miembro del equipo');
      return;
    }

    setSending(true);
    
    try {
      const recipients = selectedMembers
        .map(id => teamMembers.find(m => m.id === id))
        .filter(m => m && m.email)
        .map(m => ({ name: m!.name, email: m!.email! }));

      if (recipients.length === 0) {
        toast.error('Ninguno de los miembros seleccionados tiene email');
        setSending(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          recipients,
          subject: 'Planificación semanal - Dr. Bubu',
          message: getMessageContent(),
        },
      });

      if (error) throw error;

      toast.success(`Email enviado a ${data.sent} personas`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} emails fallaron`);
      }
      setSelectedMembers([]);
      setMessage('');
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

    // Open WhatsApp Web for each member
    const messageText = encodeURIComponent(getMessageContent());
    
    membersWithPhone.forEach((member, index) => {
      // Clean phone number (remove spaces, dashes, etc.)
      const phone = member!.phone!.replace(/[^\d+]/g, '').replace('+', '');
      const whatsappUrl = `https://wa.me/${phone}?text=${messageText}`;
      
      // Stagger opening to avoid popup blockers
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, index * 500);
    });

    toast.success(`Abriendo WhatsApp para ${membersWithPhone.length} personas`);
    setSelectedMembers([]);
    setMessage('');
  };

  const defaultMessage = `Hola,

Te enviamos la planificación de turnos para la próxima semana.

Por favor, revisa tus asignaciones y confirma tu disponibilidad.

Saludos,
Equipo del Dr. Bubu`;

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
              <CardTitle>Componer mensaje</CardTitle>
              <CardDescription>
                Personaliza el mensaje que se enviará junto con la planificación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Escribe tu mensaje..."
                value={message || defaultMessage}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="resize-none"
              />
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Se adjuntará automáticamente la planificación de la semana</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Método de envío</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="email">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="mt-4">
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-medium mb-2">Envío por Email</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Se enviará un email a cada miembro seleccionado con el mensaje personalizado.
                    </p>
                    <Button 
                      onClick={handleSendEmail} 
                      disabled={sending || selectedMembers.length === 0}
                      className="w-full"
                    >
                      {sending ? (
                        <>Enviando...</>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar por Email ({selectedMembers.length} seleccionados)
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="whatsapp" className="mt-4">
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <h4 className="font-medium mb-2">Envío por WhatsApp</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Se abrirá WhatsApp Web para enviar el mensaje a cada miembro seleccionado.
                    </p>
                    <Button 
                      onClick={handleSendWhatsApp} 
                      disabled={selectedMembers.length === 0}
                      variant="outline"
                      className="w-full border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir WhatsApp ({selectedMembers.length} seleccionados)
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
                        {member.email || member.phone || 'Sin contacto'}
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
