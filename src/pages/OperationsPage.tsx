import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Clock, Users, Stethoscope, Loader2 } from 'lucide-react';
import { DAYS_OF_WEEK, SHIFTS, OPERATION_TYPES, SPECIALTIES, Operation, OperationType, Specialty } from '@/types';
import { cn } from '@/lib/utils';
import { useCenters, useOperations, useSaveOperation, useDeleteOperation } from '@/hooks/useDatabase';
import { generateDemandSlots } from '@/data/mockData';
import { toast } from 'sonner';

export default function OperationsPage() {
  const { data: centers = [], isLoading: loadingCenters } = useCenters();
  const { data: operations = [], isLoading: loadingOperations } = useOperations();
  const saveOperation = useSaveOperation();
  const deleteOperation = useDeleteOperation();

  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  
  const isLoading = loadingCenters || loadingOperations;

  // Form state
  const [formData, setFormData] = useState({
    centerId: '',
    date: '',
    shift: 'morning' as 'morning' | 'afternoon',
    operatingRoom: '',
    type: 'general' as OperationType,
    specialty: 'general' as Specialty,
    estimatedDuration: 60,
    requiredAnesthetists: 1,
    notes: '',
  });

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
  const demandSlots = generateDemandSlots(operations);

  const getOperationsForDayAndCenter = (date: string, centerId: string, shift: 'morning' | 'afternoon') => {
    return operations.filter(op => 
      op.date === date && 
      (centerId === 'all' || op.centerId === centerId) &&
      op.shift === shift
    );
  };

  const getDemandForSlot = (date: string, centerId: string, shift: 'morning' | 'afternoon') => {
    const slot = demandSlots.find(s => s.date === date && s.centerId === centerId && s.shift === shift);
    return slot?.requiredAnesthetists || 0;
  };

  const handleOpenDialog = (operation?: Operation, date?: string, centerId?: string, shift?: 'morning' | 'afternoon') => {
    if (operation) {
      setEditingOperation(operation);
      setFormData({
        centerId: operation.centerId,
        date: operation.date,
        shift: operation.shift,
        operatingRoom: operation.operatingRoom,
        type: operation.type,
        specialty: operation.specialty,
        estimatedDuration: operation.estimatedDuration,
        requiredAnesthetists: operation.requiredAnesthetists,
        notes: operation.notes || '',
      });
    } else {
      setEditingOperation(null);
      setFormData({
        centerId: centerId || centers[0]?.id || '',
        date: date || weekDates[0].fullDate,
        shift: shift || 'morning',
        operatingRoom: '',
        type: 'general',
        specialty: 'general',
        estimatedDuration: 60,
        requiredAnesthetists: 1,
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveOperation = async () => {
    if (!formData.centerId || !formData.date || !formData.operatingRoom) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      await saveOperation.mutateAsync({
        id: editingOperation?.id,
        ...formData,
      });
      toast.success(editingOperation ? 'Operación actualizada' : 'Operación creada');
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const handleDeleteOperation = async (id: string) => {
    try {
      await deleteOperation.mutateAsync(id);
      toast.success('Operación eliminada');
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Operaciones" subtitle="Gestión de operaciones programadas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Operaciones" 
      subtitle="Gestión de operaciones programadas"
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
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Operación
          </Button>
        </div>
      </div>

      {/* Operations Grid by Center */}
      <div className="space-y-4">
        {(selectedCenter === 'all' ? centers : centers.filter(c => c.id === selectedCenter)).map((center) => (
          <Card key={center.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: center.color }}
                />
                {center.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Turno</TableHead>
                      {weekDates.slice(0, 5).map(({ day, date }) => (
                        <TableHead key={day} className="text-center">
                          <div className="font-medium">{day.slice(0, 3)}</div>
                          <div className="text-xs text-muted-foreground">{date}</div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(['morning', 'afternoon'] as const).map((shift) => (
                      <TableRow key={shift}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{SHIFTS[shift]}</Badge>
                        </TableCell>
                        {weekDates.slice(0, 5).map(({ fullDate }) => {
                          const ops = getOperationsForDayAndCenter(fullDate, center.id, shift);
                          const demand = getDemandForSlot(fullDate, center.id, shift);
                          
                          return (
                            <TableCell key={fullDate} className="p-2">
                              <div 
                                className="min-h-[80px] rounded-lg border border-dashed p-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                                onClick={() => handleOpenDialog(undefined, fullDate, center.id, shift)}
                              >
                                {ops.length > 0 ? (
                                  <div className="space-y-1">
                                    {ops.map((op) => (
                                      <div 
                                        key={op.id}
                                        className="text-xs p-1.5 rounded bg-secondary flex items-center justify-between group"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="truncate">
                                          <span className="font-medium">{op.operatingRoom}</span>
                                          <span className="text-muted-foreground"> - {OPERATION_TYPES[op.type]}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-5 w-5"
                                            onClick={() => handleOpenDialog(op)}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-5 w-5 text-destructive"
                                            onClick={() => handleDeleteOperation(op.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                    <div className="flex items-center gap-2 text-xs pt-1 border-t">
                                      <Users className="h-3 w-3 text-primary" />
                                      <span className="text-primary font-medium">{demand} anestesistas</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-muted-foreground">
                                    <Plus className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingOperation ? 'Editar Operación' : 'Nueva Operación'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Centro *</Label>
                <Select value={formData.centerId} onValueChange={(v) => setFormData(prev => ({ ...prev, centerId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={formData.shift} onValueChange={(v: 'morning' | 'afternoon') => setFormData(prev => ({ ...prev, shift: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Mañana</SelectItem>
                    <SelectItem value="afternoon">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quirófano *</Label>
                <Input 
                  placeholder="Ej: Q1"
                  value={formData.operatingRoom}
                  onChange={(e) => setFormData(prev => ({ ...prev, operatingRoom: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Operación</Label>
                <Select value={formData.type} onValueChange={(v: OperationType) => setFormData(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATION_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Select value={formData.specialty} onValueChange={(v: Specialty) => setFormData(prev => ({ ...prev, specialty: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SPECIALTIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duración (min)
                </Label>
                <Input 
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" />
                  Anestesistas requeridos
                </Label>
                <Input 
                  type="number"
                  min={1}
                  value={formData.requiredAnesthetists}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiredAnesthetists: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea 
                placeholder="Observaciones adicionales..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOperation} disabled={saveOperation.isPending}>
              {saveOperation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingOperation ? 'Guardar Cambios' : 'Crear Operación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
