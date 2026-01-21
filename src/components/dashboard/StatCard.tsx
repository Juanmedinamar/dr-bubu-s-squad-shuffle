import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'anesthetist' | 'nurse' | 'center';
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-primary/5 border-primary/20',
  anesthetist: 'bg-anesthetist-light border-anesthetist/20',
  nurse: 'bg-nurse-light border-nurse/20',
  center: 'bg-center-light border-center/20',
};

const iconStyles = {
  default: 'bg-secondary text-foreground',
  primary: 'bg-primary text-primary-foreground',
  anesthetist: 'bg-anesthetist text-white',
  nurse: 'bg-nurse text-white',
  center: 'bg-center text-white',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-5 transition-all duration-200 hover:shadow-md animate-fade-in',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              'mt-1 text-sm font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% vs semana anterior
            </p>
          )}
        </div>
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          iconStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
