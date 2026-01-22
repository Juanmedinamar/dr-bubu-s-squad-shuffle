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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TeamMember, Role } from '@/types';

interface AddEditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onSave: (member: Omit<TeamMember, 'id'> & { id?: string }) => void;
}

export function AddEditMemberDialog({ 
  open, 
  onOpenChange, 
  member, 
  onSave 
}: AddEditMemberDialogProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('anesthetist');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setRole(member.role);
      setEmail(member.email || '');
      setPhone(member.phone || '');
    } else {
      setName('');
      setRole('anesthetist');
      setEmail('');
      setPhone('');
    }
  }, [member, open]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      id: member?.id,
      name: name.trim(),
      role,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      excludedCenters: member?.excludedCenters || [],
      incompatibleWith: member?.incompatibleWith || [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Editar Miembro' : 'Añadir Miembro'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Dr. García"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anesthetist">Anestesista</SelectItem>
                <SelectItem value="nurse">Enfermero/a</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34600123456"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {member ? 'Guardar cambios' : 'Añadir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
