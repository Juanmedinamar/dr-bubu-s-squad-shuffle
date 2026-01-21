import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  FileText
} from 'lucide-react';
import { mockTeamMembers } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationsPage() {
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
    if (selectedMembers.length === mockTeamMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(mockTeamMembers.map(m => m.id));
    }
  };

  const handleSend = async (method: 'email' | 'whatsapp') => {
    if (selectedMembers.length === 0) {
      toast.error('Selecciona al menos un miembro del equipo');
      return;
    }

    setSending(true);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSending(false);
    toast.success(
      `Notificación enviada por ${method === 'email' ? 'email' : 'WhatsApp'} a ${selectedMembers.length} personas`
    );
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
                      Se enviará un email a cada miembro seleccionado con el mensaje y la planificación adjunta en formato PDF.
                    </p>
                    <Button 
                      onClick={() => handleSend('email')} 
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
                      Se abrirá WhatsApp Web para enviar el mensaje a cada miembro seleccionado de forma individual.
                    </p>
                    <Button 
                      onClick={() => handleSend('whatsapp')} 
                      disabled={sending || selectedMembers.length === 0}
                      variant="outline"
                      className="w-full border-green-500 text-green-600 hover:bg-green-50"
                    >
                      {sending ? (
                        <>Enviando...</>
                      ) : (
                        <>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Enviar por WhatsApp ({selectedMembers.length} seleccionados)
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
                {selectedMembers.length === mockTeamMembers.length ? 'Deseleccionar' : 'Seleccionar todos'}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {selectedMembers.length} de {mockTeamMembers.length} seleccionados
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {mockTeamMembers.map((member) => {
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
