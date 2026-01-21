import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/data/mockData';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export const RiskBadge = ({ level, className }: RiskBadgeProps) => {
  return (
    <span className={cn(
      "risk-badge",
      level === 'HIGH' && "risk-high",
      level === 'MEDIUM' && "risk-medium",
      level === 'LOW' && "risk-low",
      className
    )}>
      {level}
    </span>
  );
};
