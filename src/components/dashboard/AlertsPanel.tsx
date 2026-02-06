import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTeamMembers, useCenters, useOperations, useOperationAssignments } from '@/hooks/useDatabase';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info';
  message: string;
  time: string;
}

const alertStyles = {
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning/10',
    iconColor: 'text-warning',
    border: 'border-warning/20',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-success/10',
    iconColor: 'text-success',
    border: 'border-success/20',
  },
  info: {
    icon: Clock,
    bg: 'bg-primary/10',
    iconColor: 'text-primary',
    border: 'border-primary/20',
  },
};

export function AlertsPanel() {
  const { role } = useAuth();
  const { data: teamMembers = [] } = useTeamMembers(role);
  const { data: operations = [] } = useOperations();
  const { data: operationAssignments = [] } = useOperationAssignments();
  const { data: centers = [] } = useCenters();

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    
    // Get this week's dates
    const weekDates = Array.from({ length: 7 }, (_, i) => 
      format(addDays(monday, i), 'yyyy-MM-dd')
    );
    
    // Get next week's dates
    const nextMonday = addDays(monday, 7);
    const nextWeekDates = Array.from({ length: 7 }, (_, i) => 
      format(addDays(nextMonday, i), 'yyyy-MM-dd')
    );

    // Build assignments from operations and operationAssignments
    type DerivedAssignment = { memberId: string; centerId: string; date: string; shift: string; operationId: string };
    const derivedAssignments: DerivedAssignment[] = [];
    
    operations.forEach(op => {
      const opAssignments = operationAssignments.filter(a => a.operationId === op.id);
      opAssignments.forEach(a => {
        derivedAssignments.push({
          memberId: a.memberId,
          centerId: op.centerId,
          date: op.date,
          shift: op.shift,
          operationId: op.id,
        });
      });
    });

    // Check for incompatible members assigned same day/shift
    const assignmentsByDayShift = new Map<string, DerivedAssignment[]>();
    derivedAssignments.forEach(a => {
      const key = `${a.date}-${a.shift}`;
      if (!assignmentsByDayShift.has(key)) {
        assignmentsByDayShift.set(key, []);
      }
      assignmentsByDayShift.get(key)!.push(a);
    });

    assignmentsByDayShift.forEach((dayAssignments, key) => {
      if (dayAssignments.length < 2) return;
      
      dayAssignments.forEach((a1, i) => {
        dayAssignments.slice(i + 1).forEach(a2 => {
          const member1 = teamMembers.find(m => m.id === a1.memberId);
          const member2 = teamMembers.find(m => m.id === a2.memberId);
          
          if (member1 && member2) {
            const isIncompatible = 
              member1.incompatibleWith?.includes(a2.memberId) ||
              member2.incompatibleWith?.includes(a1.memberId);
            
            if (isIncompatible && a1.centerId === a2.centerId) {
              result.push({
                id: `incomp-${key}-${a1.memberId}-${a2.memberId}`,
                type: 'warning',
                message: `${member1.name.split(' ')[0]} y ${member2.name.split(' ')[0]} tienen incompatibilidad y están asignados juntos`,
                time: format(new Date(a1.date), "d 'de' MMMM", { locale: es }),
              });
            }
          }
        });
      });
    });

    // Check for members assigned to excluded centers
    derivedAssignments.forEach(a => {
      const member = teamMembers.find(m => m.id === a.memberId);
      const center = centers.find(c => c.id === a.centerId);
      
      if (member && center && member.excludedCenters?.includes(a.centerId)) {
        result.push({
          id: `excluded-${a.operationId}-${a.memberId}`,
          type: 'warning',
          message: `${member.name.split(' ')[0]} asignado a ${center.name} (centro excluido)`,
          time: format(new Date(a.date), "d 'de' MMMM", { locale: es }),
        });
      }
    });

    // Check if this week has operations
    const thisWeekOperations = operations.filter(op => weekDates.includes(op.date));
    if (thisWeekOperations.length > 0) {
      const thisWeekAssignments = derivedAssignments.filter(a => weekDates.includes(a.date));
      result.push({
        id: 'week-complete',
        type: 'success',
        message: `Esta semana: ${thisWeekOperations.length} operaciones, ${thisWeekAssignments.length} asignaciones`,
        time: 'Esta semana',
      });
    }

    // Check if next week needs planning
    const nextWeekOperations = operations.filter(op => nextWeekDates.includes(op.date));
    const nextWeekAssignments = derivedAssignments.filter(a => nextWeekDates.includes(a.date));
    if (nextWeekOperations.length === 0) {
      result.push({
        id: 'next-week-pending',
        type: 'info',
        message: 'No hay operaciones programadas para la próxima semana',
        time: 'Próxima semana',
      });
    } else if (nextWeekAssignments.length === 0) {
      result.push({
        id: 'next-week-no-staff',
        type: 'info',
        message: `${nextWeekOperations.length} operaciones sin personal asignado`,
        time: 'Próxima semana',
      });
    } else {
      result.push({
        id: 'next-week-complete',
        type: 'success',
        message: `Próxima semana: ${nextWeekOperations.length} operaciones, ${nextWeekAssignments.length} asignaciones`,
        time: 'Próxima semana',
      });
    }

    return result.slice(0, 5); // Limit to 5 alerts
  }, [teamMembers, operations, operationAssignments, centers]);

  if (alerts.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Alertas y Avisos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p className="text-sm">No hay alertas activas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Alertas y Avisos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const style = alertStyles[alert.type];
          const Icon = style.icon;
          
          return (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                style.bg,
                style.border
              )}
            >
              <Icon className={cn('h-5 w-5 mt-0.5', style.iconColor)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
