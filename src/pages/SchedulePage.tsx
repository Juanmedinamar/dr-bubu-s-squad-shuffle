import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Wand2, Loader2 } from 'lucide-react';
import { DAYS_OF_WEEK, SHIFTS } from '@/types';
import { cn } from '@/lib/utils';
import { 
  useTeamMembers, 
  useCenters, 
  useOperations, 
  useSaveOperation,
  useOperationAssignments, 
  useSaveOperationAssignment, 
  useDeleteOperationAssignment 
} from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ScheduleSlot } from '@/components/schedule/ScheduleSlot';
import { AddOperationDialog } from '@/components/schedule/AddOperationDialog';

export default function SchedulePage() {
  const { role } = useAuth();
  const { data: teamMembers = [], isLoading: loadingMembers } = useTeamMembers(role);
  const { data: centers = [], isLoading: loadingCenters } = useCenters();
  const { data: operations = [], isLoading: loadingOperations } = useOperations();
  const { data: operationAssignments = [], isLoading: loadingOpAssignments } = useOperationAssignments();
  const saveOperation = useSaveOperation();
  const saveOpAssignment = useSaveOperationAssignment();
  const deleteOpAssignment = useDeleteOperationAssignment();
  
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [addOpDialog, setAddOpDialog] = useState<{
    open: boolean;
    centerId: string;
    date: string;
    shift: 'morning' | 'afternoon';
  }>({ open: false, centerId: '', date: '', shift: 'morning' });

  const isLoading = loadingMembers || loadingCenters || loadingOperations || loadingOpAssignments;

  const getWeekDates = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    
    return DAYS_OF_WEEK.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        day,
        date: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        fullDate: date.toISOString().split('T')[0],
      };
    });
  };

  const weekDates = getWeekDates();

  const getOperationsForSlot = (date: string, centerId: string, shift: 'morning' | 'afternoon') => {
    return operations.filter(op => 
      op.date === date && 
      op.centerId === centerId && 
      op.shift === shift
    );
  };

  const handleAssignToOperation = async (operationId: string, memberId: string, role: 'anesthetist' | 'nurse') => {
    try {
      await saveOpAssignment.mutateAsync({
        operationId,
        memberId,
        roleInOperation: role,
      });
      toast.success('Asignación creada');
    } catch (error: any) {
      toast.error('Error al asignar: ' + error.message);
    }
  };

  const handleRemoveFromOperation = async (assignmentId: string) => {
    try {
      await deleteOpAssignment.mutateAsync(assignmentId);
      toast.success('Asignación eliminada');
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const handleAddOperation = (centerId: string, date: string, shift: 'morning' | 'afternoon') => {
    setAddOpDialog({ open: true, centerId, date, shift });
  };

  const handleSaveOperation = async (data: any) => {
    try {
      await saveOperation.mutateAsync(data);
      toast.success('Operación creada');
    } catch (error: any) {
      toast.error('Error al crear operación: ' + error.message);
    }
  };

  const handleAutoGenerate = async () => {
    // Get all operations for the current week
    const weekOperationIds = operations
      .filter(op => weekDates.slice(0, 5).some(d => d.fullDate === op.date))
      .map(op => op.id);

    if (weekOperationIds.length === 0) {
      toast.error('No hay operaciones programadas para esta semana');
      return;
    }

    // Track used members per day to avoid double-booking
    const usedMembersByDate: Record<string, Set<string>> = {};
    let assignmentsCreated = 0;

    for (const { fullDate } of weekDates.slice(0, 5)) {
      if (!usedMembersByDate[fullDate]) {
        usedMembersByDate[fullDate] = new Set();
      }

      // Get operations for this day
      const dayOperations = operations.filter(op => op.date === fullDate);

      for (const operation of dayOperations) {
        // Check how many anesthetists are already assigned
        const currentAssignments = operationAssignments.filter(
          a => a.operationId === operation.id && a.roleInOperation === 'anesthetist'
        );
        const needed = operation.requiredAnesthetists - currentAssignments.length;
        
        if (needed <= 0) continue;

        // Find available anesthetists
        const availableAnesthetists = teamMembers.filter(member => {
          if (member.role !== 'anesthetist') return false;
          if (usedMembersByDate[fullDate].has(member.id)) return false;
          if (member.excludedCenters.includes(operation.centerId)) return false;
          
          // Check incompatibilities
          const hasIncompatibility = currentAssignments.some(a => 
            member.incompatibleWith.includes(a.memberId)
          );
          return !hasIncompatibility;
        });

        // Assign up to needed
        const toAssign = availableAnesthetists.slice(0, needed);
        for (const member of toAssign) {
          try {
            await saveOpAssignment.mutateAsync({
              operationId: operation.id,
              memberId: member.id,
              roleInOperation: 'anesthetist',
            });
            usedMembersByDate[fullDate].add(member.id);
            assignmentsCreated++;
          } catch (error) {
            console.error('Error assigning:', error);
          }
        }
      }
    }

    if (assignmentsCreated > 0) {
      toast.success(`Planificación generada: ${assignmentsCreated} asignaciones`);
    } else {
      toast.info('No se pudieron crear nuevas asignaciones');
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Planificación" subtitle="Asignación de personal por operación">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Planificación" 
      subtitle="Asignación de personal por operación"
    >
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setWeekOffset(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 rounded-lg bg-secondary text-sm font-medium">
            Semana del {weekDates[0].date} al {weekDates[6].date}
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setWeekOffset(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setWeekOffset(0)}
          >
            Hoy
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedCenter} onValueChange={setSelectedCenter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por centro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los centros</SelectItem>
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleAutoGenerate}>
            <Wand2 className="mr-2 h-4 w-4" />
            Generar automático
          </Button>
        </div>
      </div>

      {/* Schedule Grid by Center with Shifts */}
      <div className="space-y-4">
        {(selectedCenter === 'all' ? centers : centers.filter(c => c.id === selectedCenter)).map((center) => (
          <Card key={center.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: center.color }}
                />
                {center.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-muted-foreground w-[100px]">Turno</th>
                      {weekDates.slice(0, 5).map(({ day, date }, index) => (
                        <th 
                          key={day} 
                          className={cn(
                            'p-2 text-center rounded-lg min-w-[160px]',
                            index === new Date().getDay() - 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                          )}
                        >
                          <div className="font-medium text-sm">{day.slice(0, 3)}</div>
                          <div className="text-xs opacity-80">{date}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(['morning', 'afternoon'] as const).map((shift) => (
                      <tr key={shift}>
                        <td className="p-2 font-medium">
                          <Badge variant="outline">{SHIFTS[shift]}</Badge>
                        </td>
                        {weekDates.slice(0, 5).map(({ fullDate }) => {
                          const slotOperations = getOperationsForSlot(fullDate, center.id, shift);
                          
                          return (
                            <td key={fullDate} className="p-2">
                              <ScheduleSlot
                                date={fullDate}
                                shift={shift}
                                centerId={center.id}
                                centerColor={center.color}
                                operations={slotOperations}
                                teamMembers={teamMembers}
                                operationAssignments={operationAssignments}
                                onAssignToOperation={handleAssignToOperation}
                                onRemoveFromOperation={handleRemoveFromOperation}
                                onAddOperation={() => handleAddOperation(center.id, fullDate, shift)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Operation Dialog */}
      <AddOperationDialog
        open={addOpDialog.open}
        onOpenChange={(open) => setAddOpDialog(prev => ({ ...prev, open }))}
        centers={centers}
        defaultCenterId={addOpDialog.centerId}
        defaultDate={addOpDialog.date}
        defaultShift={addOpDialog.shift}
        onSave={handleSaveOperation}
      />
    </MainLayout>
  );
}
