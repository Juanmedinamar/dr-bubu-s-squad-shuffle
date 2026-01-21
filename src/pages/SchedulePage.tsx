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
import { ChevronLeft, ChevronRight, Plus, Save, AlertTriangle } from 'lucide-react';
import { DAYS_OF_WEEK, SHIFTS } from '@/types';
import { mockTeamMembers, mockCenters, mockAssignments } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function SchedulePage() {
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState(0);

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

  const getAssignmentsForDayAndCenter = (date: string, centerId: string) => {
    return mockAssignments.filter(a => {
      const matchesDate = a.date === date;
      const matchesCenter = centerId === 'all' || a.centerId === centerId;
      return matchesDate && matchesCenter;
    });
  };

  return (
    <MainLayout 
      title="Planificación" 
      subtitle="Asignación de turnos semanales"
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
              {mockCenters.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-8 gap-2">
            {/* Header */}
            <div className="p-2 font-medium text-muted-foreground text-sm">
              Centro
            </div>
            {weekDates.map(({ day, date }, index) => (
              <div 
                key={day} 
                className={cn(
                  'p-2 text-center rounded-lg',
                  index === 4 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                )}
              >
                <div className="font-medium text-sm">{day.slice(0, 3)}</div>
                <div className="text-xs opacity-80">{date}</div>
              </div>
            ))}

            {/* Rows per center */}
            {(selectedCenter === 'all' ? mockCenters : mockCenters.filter(c => c.id === selectedCenter)).map((center) => (
              <>
                <div 
                  key={center.id}
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: `${center.color}10` }}
                >
                  <div 
                    className="w-2 h-8 rounded-full"
                    style={{ backgroundColor: center.color }}
                  />
                  <span className="text-sm font-medium truncate">{center.name}</span>
                </div>
                {weekDates.map(({ fullDate }) => {
                  const assignments = getAssignmentsForDayAndCenter(fullDate, center.id);
                  
                  return (
                    <div 
                      key={`${center.id}-${fullDate}`}
                      className="min-h-[80px] rounded-lg border border-dashed border-border p-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                      {assignments.length > 0 ? (
                        <div className="space-y-1">
                          {assignments.map((assignment) => {
                            const member = mockTeamMembers.find(m => m.id === assignment.memberId);
                            if (!member) return null;
                            
                            return (
                              <div 
                                key={assignment.id}
                                className={cn(
                                  'rounded p-1.5 text-xs',
                                  member.role === 'anesthetist' 
                                    ? 'bg-anesthetist-light text-anesthetist' 
                                    : 'bg-nurse-light text-nurse'
                                )}
                              >
                                <div className="font-medium truncate">{member.name}</div>
                                <div className="opacity-80">{SHIFTS[assignment.shift]}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team sidebar */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equipo disponible para asignar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockTeamMembers.slice(0, 10).map((member) => (
                <div
                  key={member.id}
                  draggable
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-2 cursor-grab hover:shadow-md transition-shadow',
                    member.role === 'anesthetist' ? 'border-anesthetist/30' : 'border-nurse/30'
                  )}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className={cn(
                      'text-xs text-white',
                      member.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
                    )}>
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{member.name}</span>
                  {(member.excludedCenters.length > 0 || member.incompatibleWith.length > 0) && (
                    <AlertTriangle className="h-3 w-3 text-warning" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
