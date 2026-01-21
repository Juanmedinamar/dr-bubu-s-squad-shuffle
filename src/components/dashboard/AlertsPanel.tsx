import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const alerts = [
  {
    id: 1,
    type: 'warning',
    message: 'Dr. García y Dr. Fernández asignados al mismo turno',
    time: 'Hace 2 horas',
  },
  {
    id: 2,
    type: 'success',
    message: 'Planificación de la semana 20-26 completada',
    time: 'Ayer',
  },
  {
    id: 3,
    type: 'info',
    message: 'Recordatorio: Planificación pendiente para viernes',
    time: 'Hace 1 día',
  },
];

const alertStyles = {
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning/10',
    iconColor: 'text-warning',
    border: 'border-warning/20',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-success/10',
    iconColor: 'text-success',
    border: 'border-success/20',
  },
  info: {
    icon: Clock,
    bg: 'bg-primary/10',
    iconColor: 'text-primary',
    border: 'border-primary/20',
  },
};

export function AlertsPanel() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Alertas y Avisos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const style = alertStyles[alert.type as keyof typeof alertStyles];
          const Icon = style.icon;
          
          return (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                style.bg,
                style.border
              )}
            >
              <Icon className={cn('h-5 w-5 mt-0.5', style.iconColor)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
