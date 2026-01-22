import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TeamMember } from '@/types';

interface DeleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onConfirm: (memberId: string) => void;
}

export function DeleteMemberDialog({ 
  open, 
  onOpenChange, 
  member, 
  onConfirm 
}: DeleteMemberDialogProps) {
  const handleConfirm = () => {
    if (member) {
      onConfirm(member.id);
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
          <AlertDialogDescription>
            {member && (
              <>
                ¿Estás seguro de que quieres eliminar a <strong>{member.name}</strong> del equipo? 
                Esta acción eliminará también todas sus asignaciones y no se puede deshacer.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
