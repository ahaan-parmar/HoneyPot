import { Bot, User, Scan, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttackerClassification } from '@/data/mockData';

interface ClassificationBadgeProps {
  classification: AttackerClassification;
}

const classificationConfig = {
  'Scanner': {
    icon: Scan,
    color: 'text-warning bg-warning/10 border-warning/30',
    description: 'Automated vulnerability scanner'
  },
  'Brute-forcer': {
    icon: Bot,
    color: 'text-destructive bg-destructive/10 border-destructive/30',
    description: 'Credential brute force attempts'
  },
  'Manual Attacker': {
    icon: User,
    color: 'text-primary bg-primary/10 border-primary/30',
    description: 'Human-operated attack'
  },
  'Bot Network': {
    icon: Network,
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    description: 'Part of distributed botnet'
  },
};

export const ClassificationBadge = ({ classification }: ClassificationBadgeProps) => {
  const config = classificationConfig[classification];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
      config.color
    )}>
      <Icon className="w-4 h-4" />
      <div>
        <p className="text-sm font-medium">{classification}</p>
        <p className="text-xs opacity-70">{config.description}</p>
      </div>
    </div>
  );
};
