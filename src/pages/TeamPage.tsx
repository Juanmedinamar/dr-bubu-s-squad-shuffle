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
import { Plus, Search, Mail, Phone, AlertCircle, Building2, Edit, Trash2 } from 'lucide-react';
import { mockTeamMembers, mockCenters } from '@/data/mockData';
import { TeamMember } from '@/types';
import { cn } from '@/lib/utils';
import { EditRestrictionsDialog } from '@/components/team/EditRestrictionsDialog';
import { AddEditMemberDialog } from '@/components/team/AddEditMemberDialog';
import { DeleteMemberDialog } from '@/components/team/DeleteMemberDialog';
import { toast } from 'sonner';

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'anesthetist' | 'nurse'>('all');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isRestrictionsDialogOpen, setIsRestrictionsDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getCenterName = (centerId: string) => {
    return mockCenters.find(c => c.id === centerId)?.name || centerId;
  };

  const getMemberName = (memberId: string) => {
    return teamMembers.find(m => m.id === memberId)?.name || memberId;
  };

  const handleEditRestrictions = (member: TeamMember) => {
    setEditingMember(member);
    setIsRestrictionsDialogOpen(true);
  };

  const handleSaveRestrictions = (memberId: string, excludedCenters: string[], incompatibleWith: string[]) => {
    setTeamMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, excludedCenters, incompatibleWith };
      }
      const wasIncompatible = teamMembers.find(tm => tm.id === memberId)?.incompatibleWith.includes(m.id);
      const isNowIncompatible = incompatibleWith.includes(m.id);
      
      if (isNowIncompatible && !m.incompatibleWith.includes(memberId)) {
        return { ...m, incompatibleWith: [...m.incompatibleWith, memberId] };
      }
      if (!isNowIncompatible && m.incompatibleWith.includes(memberId)) {
        return { ...m, incompatibleWith: m.incompatibleWith.filter(id => id !== memberId) };
      }
      return m;
    }));
  };

  const handleAddMember = () => {
    setMemberToEdit(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setMemberToEdit(member);
    setIsAddEditDialogOpen(true);
  };

  const handleSaveMember = (memberData: Omit<TeamMember, 'id'> & { id?: string }) => {
    if (memberData.id) {
      // Editar existente
      setTeamMembers(prev => prev.map(m => 
        m.id === memberData.id ? { ...m, ...memberData } as TeamMember : m
      ));
      toast.success('Miembro actualizado correctamente');
    } else {
      // Añadir nuevo
      const newMember: TeamMember = {
        ...memberData,
        id: `m${Date.now()}`,
      } as TeamMember;
      setTeamMembers(prev => [...prev, newMember]);
      toast.success('Miembro añadido correctamente');
    }
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    // También quitar de incompatibilidades de otros
    setTeamMembers(prev => prev.map(m => ({
      ...m,
      incompatibleWith: m.incompatibleWith.filter(id => id !== memberId)
    })));
    toast.success('Miembro eliminado correctamente');
  };

  return (
    <MainLayout title="Equipo" subtitle="Gestión de anestesistas y enfermeros">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Miembros del Equipo</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddMember}>
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
                  <TableHead className="w-[120px]">Acciones</TableHead>
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
                        <div className="flex items-center gap-1 text-warning">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">{member.excludedCenters.length} centros</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin restricciones</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.incompatibleWith.length > 0 ? (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">{member.incompatibleWith.length} personas</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Ninguna</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditMember(member)}
                          title="Editar datos"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditRestrictions(member)}
                          title="Editar restricciones"
                        >
                          <Building2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteClick(member)}
                          className="text-destructive hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Restrictions Dialog */}
      <EditRestrictionsDialog
        open={isRestrictionsDialogOpen}
        onOpenChange={setIsRestrictionsDialogOpen}
        member={editingMember}
        allMembers={teamMembers}
        allCenters={mockCenters}
        onSave={handleSaveRestrictions}
      />

      {/* Add/Edit Member Dialog */}
      <AddEditMemberDialog
        open={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        member={memberToEdit}
        onSave={handleSaveMember}
      />

      {/* Delete Member Dialog */}
      <DeleteMemberDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        member={memberToDelete}
        onConfirm={handleConfirmDelete}
      />
    </MainLayout>
  );
}
