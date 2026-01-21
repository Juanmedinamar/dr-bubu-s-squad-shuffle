import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Building2, AlertCircle } from 'lucide-react';
import { TeamMember, Center } from '@/types';
import { cn } from '@/lib/utils';

interface EditRestrictionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  allMembers: TeamMember[];
  allCenters: Center[];
  onSave: (memberId: string, excludedCenters: string[], incompatibleWith: string[]) => void;
}

export function EditRestrictionsDialog({
  open,
  onOpenChange,
  member,
  allMembers,
  allCenters,
  onSave,
}: EditRestrictionsDialogProps) {
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    if (member) {
      setSelectedCenters([...member.excludedCenters]);
      setSelectedMembers([...member.incompatibleWith]);
    }
  }, [member]);

  const toggleCenter = (centerId: string) => {
    setSelectedCenters(prev => 
      prev.includes(centerId)
        ? prev.filter(c => c !== centerId)
        : [...prev, centerId]
    );
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(m => m !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSave = () => {
    if (member) {
      onSave(member.id, selectedCenters, selectedMembers);
    }
    onOpenChange(false);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn(
                'text-white text-sm',
                member.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
              )}>
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            Editar restricciones - {member.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="centers" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="centers" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Centros
              {selectedCenters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {selectedCenters.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Personas
              {selectedMembers.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {selectedMembers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="centers" className="mt-4">
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">
                Selecciona los centros a los que NO puede ir:
              </Label>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
                {allCenters.map((center) => (
                  <div 
                    key={center.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedCenters.includes(center.id) 
                        ? "border-warning bg-warning/10" 
                        : "hover:bg-secondary/50"
                    )}
                    onClick={() => toggleCenter(center.id)}
                  >
                    <Checkbox 
                      checked={selectedCenters.includes(center.id)}
                      onCheckedChange={() => toggleCenter(center.id)}
                    />
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: center.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{center.name}</div>
                      {center.address && (
                        <div className="text-xs text-muted-foreground truncate">{center.address}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="mt-4">
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">
                Selecciona las personas con las que NO puede trabajar:
              </Label>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
                {allMembers
                  .filter(m => m.id !== member.id)
                  .map((otherMember) => (
                    <div 
                      key={otherMember.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedMembers.includes(otherMember.id) 
                          ? "border-destructive bg-destructive/10" 
                          : "hover:bg-secondary/50"
                      )}
                      onClick={() => toggleMember(otherMember.id)}
                    >
                      <Checkbox 
                        checked={selectedMembers.includes(otherMember.id)}
                        onCheckedChange={() => toggleMember(otherMember.id)}
                      />
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className={cn(
                          'text-xs text-white',
                          otherMember.role === 'anesthetist' ? 'bg-anesthetist' : 'bg-nurse'
                        )}>
                          {otherMember.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 font-medium truncate">{otherMember.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'text-xs border-0 flex-shrink-0',
                          otherMember.role === 'anesthetist' 
                            ? 'bg-anesthetist-light text-anesthetist' 
                            : 'bg-nurse-light text-nurse'
                        )}
                      >
                        {otherMember.role === 'anesthetist' ? 'Anestesista' : 'Enfermero'}
                      </Badge>
                    </div>
                  ))
                }
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}