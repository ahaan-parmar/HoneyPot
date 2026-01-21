import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { RiskBadge } from './RiskBadge';
import type { Attack } from '@/data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AttackTableProps {
  attacks: Attack[];
}

export const AttackTable = ({ attacks }: AttackTableProps) => {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Time</TableHead>
              <TableHead className="text-muted-foreground font-medium">Attacker IP</TableHead>
              <TableHead className="text-muted-foreground font-medium">Endpoint</TableHead>
              <TableHead className="text-muted-foreground font-medium">Attack Type</TableHead>
              <TableHead className="text-muted-foreground font-medium">Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attacks.map((attack) => (
              <TableRow 
                key={attack.id} 
                className="data-row"
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatDistanceToNow(attack.timestamp, { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <Link 
                    to={`/attacker/${encodeURIComponent(attack.attackerIP)}`}
                    className="font-mono text-sm text-primary hover:underline inline-flex items-center gap-1 group"
                  >
                    {attack.attackerIP}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground">
                  {attack.targetEndpoint}
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  {attack.attackType}
                </TableCell>
                <TableCell>
                  <RiskBadge level={attack.riskLevel} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
