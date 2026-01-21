import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AttackTable } from '@/components/dashboard/AttackTable';
import { LiveIndicator } from '@/components/dashboard/LiveIndicator';
import { generateMockAttacks, getAttackStats, type Attack } from '@/data/mockData';

const Index = () => {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    highRiskAttackers: 0,
    mostTargetedEndpoint: 'N/A',
    mostTargetedCount: 0,
  });

  useEffect(() => {
    const initialAttacks = generateMockAttacks(50);
    setAttacks(initialAttacks);
    setStats(getAttackStats(initialAttacks));

    const interval = setInterval(() => {
      setAttacks(prev => {
        const newAttack = generateMockAttacks(1)[0];
        const updated = [newAttack, ...prev.slice(0, 49)];
        setStats(getAttackStats(updated));
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold text-foreground">Live Attack Feed</h1>
          <LiveIndicator />
        </div>
        <div className="flex items-center gap-8">
          <StatCard label="Attacks Today" value={stats.totalToday} />
          <StatCard label="High-Risk" value={stats.highRiskAttackers} variant="danger" />
          <StatCard label="Blocked" value={Math.floor(stats.totalToday * 0.87)} variant="success" />
        </div>
      </div>

      {/* Attack Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Attacks</h2>
          <p className="text-xs text-muted-foreground">
            Showing latest {attacks.length} events
          </p>
        </div>
        <AttackTable attacks={attacks} />
      </div>
    </DashboardLayout>
  );
};

export default Index;
