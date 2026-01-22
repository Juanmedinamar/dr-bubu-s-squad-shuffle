import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useData } from '@/context/DataContext';

export function TeamList() {
  const { teamMembers } = useData();
  
  const anesthetists = teamMembers.filter(m => m.role === 'anesthetist').slice(0, 5);
  const nurses = teamMembers.filter(m => m.role === 'nurse');

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Equipo Disponible</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Anestesistas</h4>
          <div className="space-y-2">
            {anesthetists.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:bg-secondary/50"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-anesthetist text-white text-sm">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                  {member.excludedCenters.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {member.excludedCenters.length} restricciones
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="bg-anesthetist-light text-anesthetist border-0">
                  Anest.
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Enfermeros</h4>
          <div className="space-y-2">
            {nurses.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:bg-secondary/50"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-nurse text-white text-sm">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                  {member.incompatibleWith.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {member.incompatibleWith.length} incompatibilidades
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="bg-nurse-light text-nurse border-0">
                  Enf.
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
