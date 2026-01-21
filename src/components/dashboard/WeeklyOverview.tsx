import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DAYS_OF_WEEK } from '@/types';
import { mockAssignments, mockTeamMembers, mockCenters } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function WeeklyOverview() {
  const getAssignmentsForDay = (dayIndex: number) => {
    // For demo, we'll show some sample data
    return mockAssignments.slice(0, Math.min(3, dayIndex + 1));
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Vista Semanal</span>
          <Badge variant="outline" className="font-normal">
            Semana del 20 - 26 Enero
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day, index) => (
            <div key={day} className="min-h-[200px]">
              <div className={cn(
                'mb-2 rounded-lg p-2 text-center text-sm font-medium',
                index === 4 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              )}>
                {day.slice(0, 3)}
              </div>
              <div className="space-y-1">
                {getAssignmentsForDay(index).map((assignment) => {
                  const member = mockTeamMembers.find(m => m.id === assignment.memberId);
                  const center = mockCenters.find(c => c.id === assignment.centerId);
                  if (!member || !center) return null;
                  
                  return (
                    <div
                      key={assignment.id}
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
