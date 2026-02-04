import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Scissors, Users, X, Plus, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Operation, TeamMember, OPERATION_TYPES, SHIFTS } from '@/types';
import { OperationAssignment } from '@/hooks/useDatabase';

interface ScheduleSlotProps {
  date: string;
  shift: 'morning' | 'afternoon';
  centerId: string;
  centerColor: string;
  operations: Operation[];
  teamMembers: TeamMember[];
  operationAssignments: OperationAssignment[];
  onAssignToOperation: (operationId: string, memberId: string, role: 'anesthetist' | 'nurse') => void;
  onRemoveFromOperation: (assignmentId: string) => void;
  onAddOperation: () => void;
}

export function ScheduleSlot({
  date,
  shift,
  centerId,
  centerColor,
  operations,
  teamMembers,
  operationAssignments,
  onAssignToOperation,
  onRemoveFromOperation,
  onAddOperation,
}: ScheduleSlotProps) {
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getAssignmentsForOperation = (operationId: string) => {
    return operationAssignments.filter(a => a.operationId === operationId);
  };

  const getMember = (memberId: string) => {
    return teamMembers.find(m => m.id === memberId);
  };

  const getAvailableMembers = (operation: Operation) => {
    // Get all members already assigned to operations in this slot
    const slotOperationIds = operations.map(op => op.id);
    const assignedMemberIds = operationAssignments
      .filter(a => slotOperationIds.includes(a.operationId))
      .map(a => a.memberId);

    return teamMembers.filter(member => {
      // Don't show if already assigned to any operation in this slot
      if (assignedMemberIds.includes(member.id)) return false;
      // Don't show if center is excluded
      if (member.excludedCenters.includes(centerId)) return false;
      // Check incompatibilities with already assigned members
      const operationAssigns = getAssignmentsForOperation(operation.id);
      const hasIncompatibility = operationAssigns.some(a => 
        member.incompatibleWith.includes(a.memberId)
      );
      if (hasIncompatibility) return false;
      return true;
    });
  };

  const handleOpenAssign = (operation: Operation) => {
    setSelectedOperation(operation);
    setIsDialogOpen(true);
  };

  const getRequiredStaff = (operation: Operation) => {
    const assignments = getAssignmentsForOperation(operation.id);
    const assignedAnesthetists = assignments.filter(a => a.roleInOperation === 'anesthetist').length;
    return {
      assignedAnesthetists,
      requiredAnesthetists: operation.requiredAnesthetists,
      isCovered: assignedAnesthetists >= operation.requiredAnesthetists,
    };
  };

  const totalRequired = operations.reduce((sum, op) => sum + op.requiredAnesthetists, 0);
  const totalAssigned = operations.reduce((sum, op) => {
    const assignments = getAssignmentsForOperation(op.id);
    return sum + assignments.filter(a => a.roleInOperation === 'anesthetist').length;
  }, 0);
  const isSlotCovered = totalAssigned >= totalRequired;

  if (operations.length === 0) {
    return (
      <div 
        className="min-h-[100px] rounded-lg border border-dashed p-2 flex items-center justify-center text-muted-foreground hover:border-primary cursor-pointer transition-colors"
        onClick={onAddOperation}
      >
        <Plus className="h-4 w-4" />
      </div>
    );
  }

  return (
    <>
      <div 
        className={cn(
          'min-h-[100px] rounded-lg border p-2 transition-colors',
          isSlotCovered 
            ? 'border-success/50 bg-success/5' 
            : 'border-warning/50 bg-warning/5'
        )}
      >
        {/* Header with summary */}
        <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b">
          <div className="flex items-center gap-1">
            <Scissors className="h-3 w-3 text-muted-foreground" />
            <span>{operations.length} ops</span>
          </div>
          <div className={cn(
            'flex items-center gap-1 font-medium',
            isSlotCovered ? 'text-success' : 'text-warning'
          )}>
            <Users className="h-3 w-3" />
            <span>{totalAssigned}/{totalRequired}</span>
          </div>
        </div>

        {/* Operations list */}
        <div className="space-y-2">
          {operations.map((operation) => {
            const { assignedAnesthetists, requiredAnesthetists, isCovered } = getRequiredStaff(operation);
            const assignments = getAssignmentsForOperation(operation.id);

            return (
              <div 
                key={operation.id}
                className={cn(
                  'rounded border p-1.5 text-xs cursor-pointer hover:bg-secondary/50 transition-colors',
                  isCovered ? 'border-success/30' : 'border-warning/30'
                )}
                onClick={() => handleOpenAssign(operation)}
              >
                {/* Operation info */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 font-medium">
                    <span className="text-[10px] px-1 rounded bg-secondary">{operation.operatingRoom}</span>
                    <span className="truncate">{OPERATION_TYPES[operation.type]}</span>
                  </div>
                  <Badge variant={isCovered ? 'default' : 'outline'} className="text-[10px] h-4">
                    {assignedAnesthetists}/{requiredAnesthetists}
                  </Badge>
                </div>

                {/* Assigned staff */}
                {assignments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {assignments.map((assignment) => {
                      const member = getMember(assignment.memberId);
                      if (!member) return null;
                      return (
                        <div 
                          key={assignment.id}
                          className={cn(
                            'flex items-center gap-1 rounded px-1 py-0.5',
                            member.role === 'anesthetist' 
                              ? 'bg-anesthetist-light text-anesthetist' 
                              : 'bg-nurse-light text-nurse'
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[60px]">{member.name.split(' ')[0]}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-3 w-3 p-0 hover:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromOperation(assignment.id);
                            }}
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add operation button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 h-6 text-xs"
          onClick={onAddOperation}
        >
          <Plus className="h-3 w-3 mr-1" /> Añadir operación
        </Button>
      </div>

      {/* Assign Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedOperation?.operatingRoom}</span>
              <Badge variant="outline">{selectedOperation && OPERATION_TYPES[selectedOperation.type]}</Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedOperation && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedOperation.estimatedDuration} min
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {selectedOperation.requiredAnesthetists} anestesistas
                </div>
              </div>

              {/* Current assignments */}
              {getAssignmentsForOperation(selectedOperation.id).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Asignados:</p>
                  <div className="space-y-1">
                    {getAssignmentsForOperation(selectedOperation.id).map(a => {
                      const member = getMember(a.memberId);
                      if (!member) return null;
                      return (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded bg-secondary">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className={cn(
                                'text-[10px] text-white',
                                member.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
                              )}>
                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{member.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {a.roleInOperation === 'anesthetist' ? 'Anest.' : 'Enf.'}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onRemoveFromOperation(a.id)}
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
                  {getAvailableMembers(selectedOperation).map(member => (
                    <div
                      key={member.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded cursor-pointer hover:bg-secondary/80',
                        member.role === 'anesthetist' ? 'bg-anesthetist-light/50' : 'bg-nurse-light/50'
                      )}
                      onClick={() => {
                        onAssignToOperation(
                          selectedOperation.id, 
                          member.id, 
                          member.role as 'anesthetist' | 'nurse'
                        );
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className={cn(
                            'text-[10px] text-white',
                            member.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
                          )}>
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.role === 'anesthetist' ? 'Anest.' : 'Enf.'}
                      </Badge>
                    </div>
                  ))}
                  {getAvailableMembers(selectedOperation).length === 0 && (
                    <div className="flex items-center gap-2 p-3 text-muted-foreground text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      No hay personal disponible
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
