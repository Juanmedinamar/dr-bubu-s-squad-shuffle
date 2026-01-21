import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Users } from 'lucide-react';
import { mockCenters, mockTeamMembers } from '@/data/mockData';

export default function CentersPage() {
  const getExcludedCount = (centerId: string) => {
    return mockTeamMembers.filter(m => m.excludedCenters.includes(centerId)).length;
  };

  return (
    <MainLayout title="Centros" subtitle="Gestión de centros de trabajo">
      <div className="mb-6 flex justify-end">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Centro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockCenters.map((center, index) => {
          const excludedCount = getExcludedCount(center.id);
          
          return (
            <Card 
              key={center.id} 
              className="group cursor-pointer transition-all hover:shadow-lg animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white text-lg font-bold"
                      style={{ backgroundColor: center.color }}
                    >
                      {center.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{center.name}</CardTitle>
                      {center.address && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{center.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {excludedCount > 0 
                        ? `${excludedCount} restricciones` 
                        : 'Sin restricciones'}
                    </span>
                  </div>
                  <Badge 
                    variant="secondary"
                    style={{ 
                      backgroundColor: `${center.color}15`,
                      color: center.color 
                    }}
                  >
                    Activo
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
}
