import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Center } from '@/types';

const DEFAULT_COLORS = [
  '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
];

interface AddEditCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center: Center | null;
  onSave: (center: Omit<Center, 'id'> & { id?: string }) => void;
}

export function AddEditCenterDialog({ 
  open, 
  onOpenChange, 
  center, 
  onSave 
}: AddEditCenterDialogProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);

  useEffect(() => {
    if (center) {
      setName(center.name);
      setAddress(center.address || '');
      setColor(center.color);
    } else {
      setName('');
      setAddress('');
      // Seleccionar un color aleatorio
      setColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    }
  }, [center, open]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      id: center?.id,
      name: name.trim(),
      address: address.trim() || undefined,
      color,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {center ? 'Editar Centro' : 'Añadir Centro'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Hospital Central"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Av. Principal 123"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {center ? 'Guardar cambios' : 'Añadir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
