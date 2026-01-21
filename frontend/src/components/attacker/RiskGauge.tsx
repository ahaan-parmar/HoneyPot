import { cn } from '@/lib/utils';

interface RiskGaugeProps {
  score: number;
}

export const RiskGauge = ({ score }: RiskGaugeProps) => {
  const getColor = () => {
    if (score >= 80) return 'text-destructive';
    if (score >= 50) return 'text-warning';
    return 'text-success';
  };

  const getLabel = () => {
    if (score >= 80) return 'Critical';
    if (score >= 50) return 'Elevated';
    return 'Low';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(222, 30%, 18%)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-1000", getColor())}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold font-mono", getColor())}>
            {score}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Score</p>
        <p className={cn("text-sm font-semibold", getColor())}>{getLabel()}</p>
      </div>
    </div>
  );
};
