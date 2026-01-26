import { TeamMember, Assignment, Center, SHIFTS, DAYS_OF_WEEK } from '@/types';
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

export function formatMemberSchedule(
  member: TeamMember,
  assignments: Assignment[],
  centers: Center[],
  weekOffset: number = 0
): string {
  const weekDates = getWeekDates(weekOffset);
  const memberAssignments = assignments.filter(a => a.memberId === member.id);

  if (memberAssignments.length === 0) {
    return `No tienes turnos asignados esta semana.`;
  }

  const lines: string[] = [];
  lines.push(`📅 *Tus turnos de la semana:*`);
  lines.push('');

  weekDates.forEach(({ dateStr, dayName, date }) => {
    const dayAssignments = memberAssignments.filter(a => a.date === dateStr);
    if (dayAssignments.length > 0) {
      const formattedDate = format(date, "d 'de' MMMM", { locale: es });
      lines.push(`*${dayName} ${formattedDate}:*`);
      
      dayAssignments.forEach(assignment => {
        const center = centers.find(c => c.id === assignment.centerId);
        const shiftName = SHIFTS[assignment.shift];
        if (center) {
          lines.push(`  📍 ${center.name} - ${shiftName}`);
        }
      });
      lines.push('');
    }
  });

  return lines.join('\n');
}

export function formatFullScheduleText(
  teamMembers: TeamMember[],
  assignments: Assignment[],
  centers: Center[],
  weekOffset: number = 0
): string {
  const weekDates = getWeekDates(weekOffset);
  const weekStart = format(weekDates[0].date, "d 'de' MMMM", { locale: es });
  const weekEnd = format(weekDates[6].date, "d 'de' MMMM", { locale: es });

  const lines: string[] = [];
  lines.push(`📋 PLANIFICACIÓN SEMANAL`);
  lines.push(`Semana del ${weekStart} al ${weekEnd}`);
  lines.push('═'.repeat(40));
  lines.push('');

  weekDates.forEach(({ dateStr, dayName, date }) => {
    const dayAssignments = assignments.filter(a => a.date === dateStr);
    if (dayAssignments.length > 0) {
      const formattedDate = format(date, "d 'de' MMMM", { locale: es });
      lines.push(`▸ ${dayName.toUpperCase()} ${formattedDate}`);
      lines.push('-'.repeat(30));

      // Group by center
      const centerGroups = new Map<string, Assignment[]>();
      dayAssignments.forEach(a => {
        if (!centerGroups.has(a.centerId)) {
          centerGroups.set(a.centerId, []);
        }
        centerGroups.get(a.centerId)!.push(a);
      });

      centerGroups.forEach((centerAssignments, centerId) => {
        const center = centers.find(c => c.id === centerId);
        if (center) {
          lines.push(`  🏥 ${center.name}`);
          centerAssignments.forEach(assignment => {
            const member = teamMembers.find(m => m.id === assignment.memberId);
            const shiftName = SHIFTS[assignment.shift];
            if (member) {
              const role = member.role === 'anesthetist' ? '👨‍⚕️' : '👩‍⚕️';
              lines.push(`     ${role} ${member.name} (${shiftName})`);
            }
          });
        }
      });
      lines.push('');
    }
  });

  return lines.join('\n');
}
