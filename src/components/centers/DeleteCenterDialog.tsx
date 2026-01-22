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
import { Center } from '@/types';

interface DeleteCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center: Center | null;
  onConfirm: (centerId: string) => void;
}

export function DeleteCenterDialog({ 
  open, 
  onOpenChange, 
  center, 
  onConfirm 
}: DeleteCenterDialogProps) {
  const handleConfirm = () => {
    if (center) {
      onConfirm(center.id);
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar centro?</AlertDialogTitle>
          <AlertDialogDescription>
            {center && (
              <>
                ¿Estás seguro de que quieres eliminar <strong>{center.name}</strong>? 
                Esta acción eliminará también todas las asignaciones y operaciones asociadas.
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
