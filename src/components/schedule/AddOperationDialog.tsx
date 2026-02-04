import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Clock, Stethoscope } from 'lucide-react';
import { OPERATION_TYPES, SPECIALTIES, OperationType, Specialty, Center } from '@/types';

interface AddOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centers: Center[];
  defaultCenterId: string;
  defaultDate: string;
  defaultShift: 'morning' | 'afternoon';
  onSave: (data: {
    centerId: string;
    date: string;
    shift: 'morning' | 'afternoon';
    operatingRoom: string;
    type: OperationType;
    specialty: Specialty;
    estimatedDuration: number;
    requiredAnesthetists: number;
    notes: string;
  }) => void;
}

export function AddOperationDialog({
  open,
  onOpenChange,
  centers,
  defaultCenterId,
  defaultDate,
  defaultShift,
  onSave,
}: AddOperationDialogProps) {
  const [formData, setFormData] = useState({
    centerId: defaultCenterId,
    date: defaultDate,
    shift: defaultShift,
    operatingRoom: '',
    type: 'general' as OperationType,
    specialty: 'general' as Specialty,
    estimatedDuration: 60,
    requiredAnesthetists: 1,
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        centerId: defaultCenterId,
        date: defaultDate,
        shift: defaultShift,
        operatingRoom: '',
        type: 'general',
        specialty: 'general',
        estimatedDuration: 60,
        requiredAnesthetists: 1,
        notes: '',
      });
    }
  }, [open, defaultCenterId, defaultDate, defaultShift]);

  const handleSubmit = () => {
    if (!formData.operatingRoom) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Operación</DialogTitle>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.operatingRoom}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
