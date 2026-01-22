import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import { mockCenters as initialCenters, mockTeamMembers } from '@/data/mockData';
import { Center } from '@/types';
import { AddEditCenterDialog } from '@/components/centers/AddEditCenterDialog';
import { DeleteCenterDialog } from '@/components/centers/DeleteCenterDialog';
import { toast } from 'sonner';

export default function CentersPage() {
  const [centers, setCenters] = useState<Center[]>(initialCenters);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [centerToEdit, setCenterToEdit] = useState<Center | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<Center | null>(null);

  const getExcludedCount = (centerId: string) => {
    return mockTeamMembers.filter(m => m.excludedCenters.includes(centerId)).length;
  };

  const handleAddCenter = () => {
    setCenterToEdit(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEditCenter = (center: Center) => {
    setCenterToEdit(center);
    setIsAddEditDialogOpen(true);
  };

  const handleSaveCenter = (centerData: Omit<Center, 'id'> & { id?: string }) => {
    if (centerData.id) {
      // Editar existente
      setCenters(prev => prev.map(c => 
        c.id === centerData.id ? { ...c, ...centerData } as Center : c
      ));
      toast.success('Centro actualizado correctamente');
    } else {
      // Añadir nuevo
      const newCenter: Center = {
        ...centerData,
        id: `c${Date.now()}`,
      } as Center;
      setCenters(prev => [...prev, newCenter]);
      toast.success('Centro añadido correctamente');
    }
  };

  const handleDeleteClick = (center: Center) => {
    setCenterToDelete(center);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (centerId: string) => {
    setCenters(prev => prev.filter(c => c.id !== centerId));
    toast.success('Centro eliminado correctamente');
  };

  return (
    <MainLayout title="Centros" subtitle="Gestión de centros de trabajo">
      <div className="mb-6 flex justify-end">
        <Button onClick={handleAddCenter}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Centro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {centers.map((center, index) => {
          const excludedCount = getExcludedCount(center.id);
          
          return (
            <Card 
              key={center.id} 
              className="group transition-all hover:shadow-lg animate-fade-in"
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
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditCenter(center)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteClick(center)}
                      className="text-destructive hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      {/* Add/Edit Center Dialog */}
      <AddEditCenterDialog
        open={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        center={centerToEdit}
        onSave={handleSaveCenter}
      />

      {/* Delete Center Dialog */}
      <DeleteCenterDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        center={centerToDelete}
        onConfirm={handleConfirmDelete}
      />
    </MainLayout>
  );
}
