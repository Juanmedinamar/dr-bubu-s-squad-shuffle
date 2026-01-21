import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Mail, Phone, AlertCircle, Building2 } from 'lucide-react';
import { mockTeamMembers, mockCenters } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'anesthetist' | 'nurse'>('all');

  const filteredMembers = mockTeamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getCenterName = (centerId: string) => {
    return mockCenters.find(c => c.id === centerId)?.name || centerId;
  };

  const getMemberName = (memberId: string) => {
    return mockTeamMembers.find(m => m.id === memberId)?.name || memberId;
  };

  return (
    <MainLayout title="Equipo" subtitle="Gestión de anestesistas y enfermeros">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Miembros del Equipo</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Añadir Miembro
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedRole === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('all')}
              >
                Todos
              </Button>
              <Button
                variant={selectedRole === 'anesthetist' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('anesthetist')}
              >
                Anestesistas
              </Button>
              <Button
                variant={selectedRole === 'nurse' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRole('nurse')}
              >
                Enfermeros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Restricciones</TableHead>
                  <TableHead>Incompatibilidades</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="animate-fade-in">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={cn(
                            'text-white text-sm',
                            member.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
                          )}>
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'border-0',
                          member.role === 'anesthetist' 
                            ? 'bg-anesthetist-light text-anesthetist' 
                            : 'bg-nurse-light text-nurse'
                        )}
                      >
                        {member.role === 'anesthetist' ? 'Anestesista' : 'Enfermero/a'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {member.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.excludedCenters.length > 0 ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              <div className="flex items-center gap-1 text-warning">
                                <Building2 className="h-4 w-4" />
                                <span>{member.excludedCenters.length} centros</span>
                              </div>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Centros excluidos - {member.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                              {member.excludedCenters.map((centerId) => (
                                <div key={centerId} className="flex items-center gap-2 rounded-lg border p-3">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span>{getCenterName(centerId)}</span>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin restricciones</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.incompatibleWith.length > 0 ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              <div className="flex items-center gap-1 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <span>{member.incompatibleWith.length} personas</span>
                              </div>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Incompatibilidades - {member.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                              {member.incompatibleWith.map((memberId) => (
                                <div key={memberId} className="flex items-center gap-2 rounded-lg border p-3">
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                  <span>{getMemberName(memberId)}</span>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-sm text-muted-foreground">Ninguna</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
