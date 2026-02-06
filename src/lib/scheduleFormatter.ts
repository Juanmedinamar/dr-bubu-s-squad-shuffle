import { TeamMember, Center, Operation, SHIFTS, DAYS_OF_WEEK } from '@/types';
import { OperationAssignment } from '@/hooks/useDatabase';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function getWeekDates(weekOffset: number = 0): { date: Date; dateStr: string; dayName: string }[] {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  monday.setDate(monday.getDate() + weekOffset * 7);

  return DAYS_OF_WEEK.map((dayName, index) => {
    const date = addDays(monday, index);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName,
    };
  });
}

// New function using operations and operation_assignments
export function formatMemberScheduleFromOperations(
  member: TeamMember,
  operations: Operation[],
  operationAssignments: OperationAssignment[],
  centers: Center[],
  weekOffset: number = 0
): string {
  const weekDates = getWeekDates(weekOffset);
  const weekDateStrs = weekDates.map(d => d.dateStr);
  
  // Get operation assignments for this member
  const memberOpAssignments = operationAssignments.filter(a => a.memberId === member.id);
  const memberOperationIds = memberOpAssignments.map(a => a.operationId);
  
  // Get operations for this member in the week
  const memberOperations = operations.filter(
    op => memberOperationIds.includes(op.id) && weekDateStrs.includes(op.date)
  );

  if (memberOperations.length === 0) {
    return `No tienes turnos asignados esta semana.`;
  }

  const lines: string[] = [];
  lines.push(`📅 *Tus turnos de la semana:*`);
  lines.push('');

  weekDates.forEach(({ dateStr, dayName, date }) => {
    const dayOperations = memberOperations.filter(op => op.date === dateStr);
    if (dayOperations.length > 0) {
      const formattedDate = format(date, "d 'de' MMMM", { locale: es });
      lines.push(`*${dayName} ${formattedDate}:*`);
      
      dayOperations.forEach(operation => {
        const center = centers.find(c => c.id === operation.centerId);
        const shiftName = SHIFTS[operation.shift];
        if (center) {
          lines.push(`  📍 ${center.name} - ${shiftName}`);
          lines.push(`     ${operation.specialty} - ${operation.type}`);
        }
      });
      lines.push('');
    }
  });

  return lines.join('\n');
}

export function formatFullScheduleFromOperations(
  teamMembers: TeamMember[],
  operations: Operation[],
  operationAssignments: OperationAssignment[],
  centers: Center[],
  weekOffset: number = 0
): string {
  const weekDates = getWeekDates(weekOffset);
  const weekDateStrs = weekDates.map(d => d.dateStr);
  const weekStart = format(weekDates[0].date, "d 'de' MMMM", { locale: es });
  const weekEnd = format(weekDates[6].date, "d 'de' MMMM", { locale: es });

  const lines: string[] = [];
  lines.push(`📋 PLANIFICACIÓN SEMANAL`);
  lines.push(`Semana del ${weekStart} al ${weekEnd}`);
  lines.push('═'.repeat(40));
  lines.push('');

  // Get operations for the week
  const weekOperations = operations.filter(op => weekDateStrs.includes(op.date));

  weekDates.forEach(({ dateStr, dayName, date }) => {
    const dayOperations = weekOperations.filter(op => op.date === dateStr);
    if (dayOperations.length > 0) {
      const formattedDate = format(date, "d 'de' MMMM", { locale: es });
      lines.push(`▸ ${dayName.toUpperCase()} ${formattedDate}`);
      lines.push('-'.repeat(30));

      // Group by center
      const centerGroups = new Map<string, Operation[]>();
      dayOperations.forEach(op => {
        if (!centerGroups.has(op.centerId)) {
          centerGroups.set(op.centerId, []);
        }
        centerGroups.get(op.centerId)!.push(op);
      });

      centerGroups.forEach((centerOps, centerId) => {
        const center = centers.find(c => c.id === centerId);
        if (center) {
          lines.push(`  🏥 ${center.name}`);
          centerOps.forEach(operation => {
            const opAssignments = operationAssignments.filter(a => a.operationId === operation.id);
            const shiftName = SHIFTS[operation.shift];
            lines.push(`     📋 ${operation.specialty} - ${operation.type} (${shiftName})`);
            
            opAssignments.forEach(assignment => {
              const member = teamMembers.find(m => m.id === assignment.memberId);
              if (member) {
                const role = member.role === 'anesthetist' ? '👨‍⚕️' : '👩‍⚕️';
                lines.push(`        ${role} ${member.name}`);
              }
            });
          });
        }
      });
      lines.push('');
    }
  });

  return lines.join('\n');
}
