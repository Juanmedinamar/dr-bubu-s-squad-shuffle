import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DAYS_OF_WEEK } from '@/types';
import { cn } from '@/lib/utils';
import { useOperations, useOperationAssignments, useTeamMembers, useCenters } from '@/hooks/useDatabase';
import { Loader2 } from 'lucide-react';

export function WeeklyOverview() {
  const { data: operations = [], isLoading: loadingOperations } = useOperations();
  const { data: operationAssignments = [], isLoading: loadingOpAssignments } = useOperationAssignments();
  const { data: teamMembers = [], isLoading: loadingMembers } = useTeamMembers();
  const { data: centers = [], isLoading: loadingCenters } = useCenters();

  const isLoading = loadingOperations || loadingOpAssignments || loadingMembers || loadingCenters;

  const getAssignmentsForDay = (dayIndex: number) => {
    // Get today's date and calculate the date for the given day
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayIndex);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Get operations for this day
    const dayOperations = operations.filter(op => op.date === dateStr);
    
    // Get all assignments for these operations
    const dayAssignments: { memberId: string; centerId: string; operationId: string }[] = [];
    
    dayOperations.forEach(op => {
      const opAssignments = operationAssignments.filter(a => a.operationId === op.id);
      opAssignments.forEach(a => {
        dayAssignments.push({
          memberId: a.memberId,
          centerId: op.centerId,
          operationId: op.id,
        });
      });
    });
    
    return dayAssignments;
  };

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Vista Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Vista Semanal</span>
          <Badge variant="outline" className="font-normal">
            Semana actual
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day, index) => {
            const dayAssignments = getAssignmentsForDay(index);
            
            return (
              <div key={day} className="min-h-[350px]">
                <div className={cn(
                  'mb-2 rounded-lg p-2 text-center text-sm font-medium',
                  index === new Date().getDay() - 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                )}>
                  {day.slice(0, 3)}
                </div>
                <div className="space-y-1">
                  {dayAssignments.map((assignment) => {
                    const member = teamMembers.find(m => m.id === assignment.memberId);
                    const center = centers.find(c => c.id === assignment.centerId);
                    if (!member || !center) return null;
                    
                    return (
                      <div
                        key={`${assignment.operationId}-${assignment.memberId}`}
                        className="rounded-md border border-border bg-card p-2 text-xs shadow-sm transition-all hover:shadow-md"
                        style={{ borderLeftColor: center.color, borderLeftWidth: '3px' }}
                      >
                        <p className="font-medium text-foreground truncate">{member.name}</p>
                        <p className="text-muted-foreground truncate">{center.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
