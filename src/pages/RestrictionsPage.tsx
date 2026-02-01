import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Building2, AlertCircle, X, Plus, Edit, Loader2 } from 'lucide-react';
import { TeamMember } from '@/types';
import { cn } from '@/lib/utils';
import { useTeamMembers, useCenters, useSaveTeamMember } from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function RestrictionsPage() {
  const { role } = useAuth();
  const { data: teamMembers = [], isLoading: loadingMembers } = useTeamMembers(role);
  const { data: centers = [], isLoading: loadingCenters } = useCenters();
  const saveMember = useSaveTeamMember();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editType, setEditType] = useState<'centers' | 'members'>('centers');
  
  // Edit form state
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const isLoading = loadingMembers || loadingCenters;

  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const membersWithCenterRestrictions = filteredMembers.filter(m => m.excludedCenters.length > 0);
  const membersWithIncompatibilities = filteredMembers.filter(m => m.incompatibleWith.length > 0);

  const getCenterName = (centerId: string) => centers.find(c => c.id === centerId)?.name || centerId;
  const getCenterColor = (centerId: string) => centers.find(c => c.id === centerId)?.color || '#888';
  const getMemberName = (memberId: string) => teamMembers.find(m => m.id === memberId)?.name || memberId;

  const handleEditRestrictions = (member: TeamMember, type: 'centers' | 'members') => {
    setEditingMember(member);
    setEditType(type);
    if (type === 'centers') {
      setSelectedCenters([...member.excludedCenters]);
    } else {
      setSelectedMembers([...member.incompatibleWith]);
    }
    setIsDialogOpen(true);
  };

  const handleSaveRestrictions = async () => {
    if (!editingMember) return;
    
    try {
      if (editType === 'centers') {
        await saveMember.mutateAsync({
          ...editingMember,
          excludedCenters: selectedCenters,
        });
        toast.success('Restricciones de centros actualizadas');
      } else {
        // Update the editing member's incompatibilities
        await saveMember.mutateAsync({
          ...editingMember,
          incompatibleWith: selectedMembers,
        });
        
        // Update bidirectional incompatibilities
        for (const memberId of selectedMembers) {
          const otherMember = teamMembers.find(m => m.id === memberId);
          if (otherMember && !otherMember.incompatibleWith.includes(editingMember.id)) {
            await saveMember.mutateAsync({
              ...otherMember,
              incompatibleWith: [...otherMember.incompatibleWith, editingMember.id],
            });
          }
        }
        
        // Remove bidirectional incompatibilities for deselected members
        const previouslySelected = editingMember.incompatibleWith;
        const nowDeselected = previouslySelected.filter(id => !selectedMembers.includes(id));
        for (const memberId of nowDeselected) {
          const otherMember = teamMembers.find(m => m.id === memberId);
          if (otherMember) {
            await saveMember.mutateAsync({
              ...otherMember,
              incompatibleWith: otherMember.incompatibleWith.filter(id => id !== editingMember.id),
            });
          }
        }
        
        toast.success('Incompatibilidades actualizadas');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving restrictions:', error);
      toast.error('Error al guardar las restricciones');
    }
  };

  const handleRemoveCenterRestriction = async (member: TeamMember, centerId: string) => {
    try {
      await saveMember.mutateAsync({
        ...member,
        excludedCenters: member.excludedCenters.filter(c => c !== centerId),
      });
      toast.success('Restricción eliminada');
    } catch (error) {
      console.error('Error removing restriction:', error);
      toast.error('Error al eliminar la restricción');
    }
  };

  const handleRemoveIncompatibility = async (member: TeamMember, incompatibleId: string) => {
    try {
      // Remove from both members
      await saveMember.mutateAsync({
        ...member,
        incompatibleWith: member.incompatibleWith.filter(id => id !== incompatibleId),
      });
      
      const otherMember = teamMembers.find(m => m.id === incompatibleId);
      if (otherMember) {
        await saveMember.mutateAsync({
          ...otherMember,
          incompatibleWith: otherMember.incompatibleWith.filter(id => id !== member.id),
        });
      }
      
      toast.success('Incompatibilidad eliminada');
    } catch (error) {
      console.error('Error removing incompatibility:', error);
      toast.error('Error al eliminar la incompatibilidad');
    }
  };

  const toggleCenter = (centerId: string) => {
    setSelectedCenters(prev => 
      prev.includes(centerId)
        ? prev.filter(c => c !== centerId)
        : [...prev, centerId]
    );
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(m => m !== memberId)
        : [...prev, memberId]
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Restricciones" subtitle="Gestión centralizada de restricciones e incompatibilidades">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Restricciones" 
      subtitle="Gestión centralizada de restricciones e incompatibilidades"
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar miembro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="centers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="centers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Centros Excluidos
            <Badge variant="secondary" className="ml-1">{membersWithCenterRestrictions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="incompatibilities" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Incompatibilidades
            <Badge variant="secondary" className="ml-1">{membersWithIncompatibilities.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="centers">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Restricciones por Centro</CardTitle>
            </CardHeader>
            <CardContent>
              {membersWithCenterRestrictions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay restricciones de centros configuradas
                </div>
              ) : (
                <div className="space-y-4">
                  {membersWithCenterRestrictions.map((member) => (
                    <div key={member.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn(
                          'text-white',
                          member.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
                        )}>
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">{member.name}</span>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                'ml-2 border-0',
                                member.role === 'anesthetist' 
                                  ? 'bg-anesthetist-light text-anesthetist' 
                                  : 'bg-nurse-light text-nurse'
                              )}
                            >
                              {member.role === 'anesthetist' ? 'Anestesista' : 'Enfermero/a'}
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditRestrictions(member, 'centers')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {member.excludedCenters.map((centerId) => (
                            <Badge 
                              key={centerId} 
                              variant="outline"
                              className="flex items-center gap-1"
                              style={{ borderColor: getCenterColor(centerId), color: getCenterColor(centerId) }}
                            >
                              <Building2 className="h-3 w-3" />
                              {getCenterName(centerId)}
                              <button 
                                className="ml-1 hover:bg-secondary rounded"
                                onClick={() => handleRemoveCenterRestriction(member, centerId)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Quick add section */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Añadir nueva restricción</h4>
                <div className="flex flex-wrap gap-2">
                  {filteredMembers.filter(m => m.excludedCenters.length === 0).slice(0, 5).map((member) => (
                    <Button 
                      key={member.id}
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditRestrictions(member, 'centers')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {member.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incompatibilities">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Incompatibilidades entre Miembros</CardTitle>
            </CardHeader>
            <CardContent>
              {membersWithIncompatibilities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay incompatibilidades configuradas
                </div>
              ) : (
                <div className="space-y-4">
                  {membersWithIncompatibilities.map((member) => (
                    <div key={member.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn(
                          'text-white',
                          member.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
                        )}>
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">{member.name}</span>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                'ml-2 border-0',
                                member.role === 'anesthetist' 
                                  ? 'bg-anesthetist-light text-anesthetist' 
                                  : 'bg-nurse-light text-nurse'
                              )}
                            >
                              {member.role === 'anesthetist' ? 'Anestesista' : 'Enfermero/a'}
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditRestrictions(member, 'members')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {member.incompatibleWith.map((memberId) => {
                            const incompatibleMember = teamMembers.find(m => m.id === memberId);
                            if (!incompatibleMember) return null;
                            
                            return (
                              <Badge 
                                key={memberId} 
                                variant="outline"
                                className="flex items-center gap-1 border-destructive text-destructive"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {getMemberName(memberId)}
                                <button 
                                  className="ml-1 hover:bg-secondary rounded"
                                  onClick={() => handleRemoveIncompatibility(member, memberId)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Quick add section */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Añadir nueva incompatibilidad</h4>
                <div className="flex flex-wrap gap-2">
                  {filteredMembers.filter(m => m.incompatibleWith.length === 0).slice(0, 5).map((member) => (
                    <Button 
                      key={member.id}
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditRestrictions(member, 'members')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {member.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editType === 'centers' 
                ? `Centros excluidos - ${editingMember?.name}`
                : `Incompatibilidades - ${editingMember?.name}`
              }
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {editType === 'centers' ? (
              <div className="space-y-3">
                <Label>Selecciona los centros a los que NO puede ir:</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {centers.map((center) => (
                    <div 
                      key={center.id}
                      className="flex items-center gap-3 p-2 rounded-lg border hover:bg-secondary/50 cursor-pointer"
                      onClick={() => toggleCenter(center.id)}
                    >
                      <Checkbox 
                        checked={selectedCenters.includes(center.id)}
                        onCheckedChange={() => toggleCenter(center.id)}
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: center.color }}
                      />
                      <span>{center.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Selecciona los miembros incompatibles:</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {teamMembers
                    .filter(m => m.id !== editingMember?.id)
                    .map((member) => (
                      <div 
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg border hover:bg-secondary/50 cursor-pointer"
                        onClick={() => toggleMember(member.id)}
                      >
                        <Checkbox 
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={() => toggleMember(member.id)}
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className={cn(
                            'text-xs text-white',
                            member.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
                          )}>
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            'ml-auto text-xs border-0',
                            member.role === 'anesthetist' 
                              ? 'bg-anesthetist-light text-anesthetist' 
                              : 'bg-nurse-light text-nurse'
                          )}
                        >
                          {member.role === 'anesthetist' ? 'Anestesista' : 'Enfermero'}
                        </Badge>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRestrictions} disabled={saveMember.isPending}>
              {saveMember.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
