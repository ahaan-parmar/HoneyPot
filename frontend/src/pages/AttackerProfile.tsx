import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft, Globe, Server, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RiskGauge } from '@/components/attacker/RiskGauge';
import { ClassificationBadge } from '@/components/attacker/ClassificationBadge';
import { RequestsChart } from '@/components/charts/RequestsChart';
import { AttackTable } from '@/components/dashboard/AttackTable';
import { generateAttackerProfile } from '@/data/mockData';

const AttackerProfile = () => {
  const { ip } = useParams<{ ip: string }>();
  const decodedIP = ip ? decodeURIComponent(ip) : '';
  
  const profile = useMemo(() => generateAttackerProfile(decodedIP), [decodedIP]);

  return (
    <DashboardLayout>
      {/* Back button */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Live Feed
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-mono text-foreground mb-1">{profile.ip}</h1>
          <p className="text-sm text-muted-foreground">Attacker behavior analysis</p>
        </div>
        <ClassificationBadge classification={profile.classification} />
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Risk Score */}
        <div className="rounded-lg border border-border bg-card p-6 flex items-center justify-center">
          <RiskGauge score={profile.riskScore} />
        </div>

        {/* Details */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Details</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Country</p>
                <p className="text-sm font-medium text-foreground">{profile.country}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">ISP</p>
                <p className="text-sm font-medium text-foreground">{profile.isp}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Timeline</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">First Seen</p>
                <p className="text-sm font-mono text-foreground">
                  {format(profile.firstSeen, 'MMM dd, HH:mm')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Last Active</p>
                <p className="text-sm font-mono text-foreground">
                  {format(profile.lastSeen, 'MMM dd, HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Statistics</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold font-mono text-foreground">{profile.totalRequests.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground">Endpoints Targeted</p>
              <p className="text-2xl font-bold font-mono text-primary">{profile.targetedEndpoints.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Request Rate Chart */}
      <div className="rounded-lg border border-border bg-card p-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Requests Per Minute (Last 60 min)</h3>
        <RequestsChart data={profile.requestsPerMinute} />
      </div>

      {/* Targeted Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Targeted Endpoints</h3>
          <div className="space-y-2">
            {profile.targetedEndpoints.map((item) => (
              <div 
                key={item.endpoint} 
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <span className="font-mono text-sm text-foreground truncate max-w-[70%]">
                  {item.endpoint}
                </span>
                <span className="font-mono text-sm text-muted-foreground">{item.count} hits</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attack Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Attack Timeline</h3>
        <AttackTable attacks={profile.attackTimeline} />
      </div>
    </DashboardLayout>
  );
};

export default AttackerProfile;
