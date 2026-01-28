import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Save, AlertTriangle, Users, X, Scissors, Wand2 } from 'lucide-react';
import { DAYS_OF_WEEK, SHIFTS, Assignment } from '@/types';
import { cn } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { generateDemandSlots } from '@/data/mockData';
import { toast } from 'sonner';

export default function SchedulePage() {
  const { teamMembers, centers, assignments, setAssignments, operations } = useData();
  
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    centerId: string;
    date: string;
    shift: 'morning' | 'afternoon';
  } | null>(null);

  const demandSlots = generateDemandSlots(operations);

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

  const getAssignmentsForSlot = (date: string, centerId: string, shift: 'morning' | 'afternoon') => {
    return assignments.filter(a => {
      const matchesDate = a.date === date;
      const matchesCenter = a.centerId === centerId;
      const matchesShift = a.shift === shift || a.shift === 'full';
      return matchesDate && matchesCenter && matchesShift;
    });
  };

  const getDemandForSlot = (date: string, centerId: string, shift: 'morning' | 'afternoon') => {
    const slot = demandSlots.find(s => s.date === date && s.centerId === centerId && s.shift === shift);
    return {
      requiredAnesthetists: slot?.requiredAnesthetists || 0,
      requiredNurses: slot?.requiredNurses || 0,
      operationsCount: slot?.operations.length || 0,
    };
  };

  const getAvailableMembers = (date: string, centerId: string, shift: 'morning' | 'afternoon') => {
    const existingAssignments = assignments.filter(a => a.date === date);
    const assignedMemberIds = existingAssignments.map(a => a.memberId);
    
    return teamMembers.filter(member => {
      const isAlreadyAssigned = assignedMemberIds.includes(member.id);
      const hasExcludedCenter = member.excludedCenters.includes(centerId);
      const slotAssignments = getAssignmentsForSlot(date, centerId, shift);
      const hasIncompatibility = slotAssignments.some(a => 
        member.incompatibleWith.includes(a.memberId)
      );
      
      return !isAlreadyAssigned && !hasExcludedCenter && !hasIncompatibility;
    });
  };

  const handleOpenAssignDialog = (centerId: string, date: string, shift: 'morning' | 'afternoon') => {
    setSelectedSlot({ centerId, date, shift });
    setIsAssignDialogOpen(true);
  };

  const handleAssignMember = (memberId: string) => {
    if (!selectedSlot) return;
    
    const newAssignment: Assignment = {
      id: `as${Date.now()}`,
      memberId,
      centerId: selectedSlot.centerId,
      date: selectedSlot.date,
      shift: selectedSlot.shift,
    };
    
    setAssignments(prev => [...prev, newAssignment]);
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  };

  const handleSave = () => {
    toast.success('Planificación guardada correctamente');
  };

  const handleAutoGenerate = () => {
    const newAssignments: Assignment[] = [];
    const usedMembersByDate: Record<string, Set<string>> = {};

    weekDates.slice(0, 5).forEach(({ fullDate }) => {
      if (!usedMembersByDate[fullDate]) {
        usedMembersByDate[fullDate] = new Set();
      }

      centers.forEach(center => {
        (['morning', 'afternoon'] as const).forEach(shift => {
          const demand = getDemandForSlot(fullDate, center.id, shift);
          if (demand.requiredAnesthetists === 0) return;

          const availableAnesthetists = teamMembers.filter(member => {
            if (member.role !== 'anesthetist') return false;
            if (usedMembersByDate[fullDate].has(member.id)) return false;
            if (member.excludedCenters.includes(center.id)) return false;
            
            const slotAssignments = newAssignments.filter(a => 
              a.date === fullDate && a.centerId === center.id && a.shift === shift
            );
            const hasIncompatibility = slotAssignments.some(a => 
              member.incompatibleWith.includes(a.memberId)
            );
            return !hasIncompatibility;
          });

          const toAssign = availableAnesthetists.slice(0, demand.requiredAnesthetists);
          toAssign.forEach(member => {
            newAssignments.push({
              id: `as${Date.now()}-${member.id}-${shift}`,
              memberId: member.id,
              centerId: center.id,
              date: fullDate,
              shift,
            });
            usedMembersByDate[fullDate].add(member.id);
          });

          const availableNurses = teamMembers.filter(member => {
            if (member.role !== 'nurse') return false;
            if (usedMembersByDate[fullDate].has(member.id)) return false;
            if (member.excludedCenters.includes(center.id)) return false;
            return true;
          });

          const nursesToAssign = availableNurses.slice(0, demand.requiredNurses);
          nursesToAssign.forEach(member => {
            newAssignments.push({
              id: `as${Date.now()}-${member.id}-${shift}-n`,
              memberId: member.id,
              centerId: center.id,
              date: fullDate,
              shift,
            });
            usedMembersByDate[fullDate].add(member.id);
          });
        });
      });
    });

    if (newAssignments.length === 0) {
      toast.error('No hay operaciones programadas para esta semana');
      return;
    }

    setAssignments(newAssignments);
    toast.success(`Planificación generada: ${newAssignments.length} asignaciones`);
  };

  const getCenterName = (centerId: string) => centers.find(c => c.id === centerId)?.name || '';

  return (
    <MainLayout 
      title="Planificación" 
      subtitle="Asignación de turnos semanales por demanda"
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
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Guardar
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
                            'p-2 text-center rounded-lg min-w-[140px]',
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
                          const slotAssignments = getAssignmentsForSlot(fullDate, center.id, shift);
                          const demand = getDemandForSlot(fullDate, center.id, shift);
                          const assignedAnesthetists = slotAssignments.filter(a => 
                            teamMembers.find(m => m.id === a.memberId)?.role === 'anesthetist'
                          ).length;
                          const isCovered = assignedAnesthetists >= demand.requiredAnesthetists;
                          
                          return (
                            <td key={fullDate} className="p-2">
                              <div 
                                className={cn(
                                  'min-h-[100px] rounded-lg border p-2 transition-colors',
                                  demand.operationsCount > 0 
                                    ? isCovered 
                                      ? 'border-success/50 bg-success/5' 
                                      : 'border-warning/50 bg-warning/5'
                                    : 'border-dashed border-border',
                                  'hover:border-primary cursor-pointer'
                                )}
                                onClick={() => handleOpenAssignDialog(center.id, fullDate, shift)}
                              >
                                {/* Demand header */}
                                {demand.operationsCount > 0 && (
                                  <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b">
                                    <div className="flex items-center gap-1">
                                      <Scissors className="h-3 w-3 text-muted-foreground" />
                                      <span>{demand.operationsCount} ops</span>
                                    </div>
                                    <div className={cn(
                                      'flex items-center gap-1 font-medium',
                                      isCovered ? 'text-success' : 'text-warning'
                                    )}>
                                      <Users className="h-3 w-3" />
                                      <span>{assignedAnesthetists}/{demand.requiredAnesthetists}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Assignments */}
                                <div className="space-y-1">
                                  {slotAssignments.map((assignment) => {
                                    const member = teamMembers.find(m => m.id === assignment.memberId);
                                    if (!member) return null;
                                    
                                    return (
                                      <div 
                                        key={assignment.id}
                                        className={cn(
                                          'rounded p-1.5 text-xs flex items-center justify-between group',
                                          member.role === 'anesthetist' 
                                            ? 'bg-anesthetist-light text-anesthetist' 
                                            : 'bg-nurse-light text-nurse'
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <Avatar className="h-5 w-5">
                                            <AvatarFallback className="text-[10px]">
                                              {member.name.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="truncate">{member.name}</span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-4 w-4 opacity-0 group-hover:opacity-100"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveAssignment(assignment.id);
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
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

      {/* Assign Member Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Asignar personal - {selectedSlot && getCenterName(selectedSlot.centerId)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {selectedSlot.date} - {SHIFTS[selectedSlot.shift]}
              </div>

              {/* Current assignments */}
              {getAssignmentsForSlot(selectedSlot.date, selectedSlot.centerId, selectedSlot.shift).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Asignados:</p>
                  <div className="space-y-1">
                    {getAssignmentsForSlot(selectedSlot.date, selectedSlot.centerId, selectedSlot.shift).map(a => {
                      const member = teamMembers.find(m => m.id === a.memberId);
                      if (!member) return null;
                      return (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded bg-secondary">
                          <span className="text-sm">{member.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveAssignment(a.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available members */}
              <div>
                <p className="text-sm font-medium mb-2">Disponibles:</p>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {getAvailableMembers(selectedSlot.date, selectedSlot.centerId, selectedSlot.shift).map(member => (
                    <div 
                      key={member.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded cursor-pointer transition-colors',
                        'hover:bg-secondary'
                      )}
                      onClick={() => handleAssignMember(member.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.role === 'anesthetist' ? 'Anestesista' : 'Enfermero'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={member.role === 'anesthetist' ? 'default' : 'secondary'}>
                        {member.role === 'anesthetist' ? 'A' : 'E'}
                      </Badge>
                    </div>
                  ))}
                  {getAvailableMembers(selectedSlot.date, selectedSlot.centerId, selectedSlot.shift).length === 0 && (
                    <div className="flex items-center gap-2 p-4 rounded bg-warning/10 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">No hay personal disponible</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
