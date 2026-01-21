import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export const StatCard = ({ label, value, variant = 'default' }: StatCardProps) => {
  return (
    <div className="flex items-baseline gap-3">
      <p className={cn(
        "text-2xl font-bold font-mono",
        variant === 'danger' && "text-destructive",
        variant === 'warning' && "text-warning",
        variant === 'success' && "text-success",
        variant === 'default' && "text-primary"
      )}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
};
