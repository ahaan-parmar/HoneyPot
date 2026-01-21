export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type AttackType = 
  | 'Brute Force' 
  | 'SQL Injection' 
  | 'XSS' 
  | 'IDOR' 
  | 'API Abuse' 
  | 'Path Traversal'
  | 'Command Injection'
  | 'Credential Stuffing';

export type AttackerClassification = 'Scanner' | 'Brute-forcer' | 'Manual Attacker' | 'Bot Network';

export interface Attack {
  id: string;
  timestamp: Date;
  attackerIP: string;
  targetEndpoint: string;
  attackType: AttackType;
  riskLevel: RiskLevel;
  userAgent?: string;
  payload?: string;
}

export interface AttackerProfile {
  ip: string;
  riskScore: number;
  classification: AttackerClassification;
  firstSeen: Date;
  lastSeen: Date;
  totalRequests: number;
  requestsPerMinute: number[];
  attackTimeline: Attack[];
  targetedEndpoints: { endpoint: string; count: number }[];
  country?: string;
  isp?: string;
}

const attackTypes: AttackType[] = [
  'Brute Force', 'SQL Injection', 'XSS', 'IDOR', 
  'API Abuse', 'Path Traversal', 'Command Injection', 'Credential Stuffing'
];

const endpoints = [
  '/api/auth/login',
  '/api/users/profile',
  '/api/admin/users',
  '/api/v1/data/export',
  '/api/payments/process',
  '/wp-admin/admin-ajax.php',
  '/.env',
  '/api/v1/files/upload',
  '/graphql',
  '/api/auth/reset-password',
];

const generateIP = () => {
  const ranges = [
    () => `45.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    () => `185.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    () => `91.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    () => `194.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    () => `103.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  ];
  return ranges[Math.floor(Math.random() * ranges.length)]();
};

const generateRiskLevel = (): RiskLevel => {
  const rand = Math.random();
  if (rand < 0.25) return 'HIGH';
  if (rand < 0.6) return 'MEDIUM';
  return 'LOW';
};

export const generateMockAttacks = (count: number): Attack[] => {
  const now = new Date();
  const attacks: Attack[] = [];
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    attacks.push({
      id: `attack-${i}-${Date.now()}`,
      timestamp,
      attackerIP: generateIP(),
      targetEndpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
      attackType: attackTypes[Math.floor(Math.random() * attackTypes.length)],
      riskLevel: generateRiskLevel(),
    });
  }
  
  return attacks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const generateAttackerProfile = (ip: string): AttackerProfile => {
  const now = new Date();
  const firstSeen = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  
  const classifications: AttackerClassification[] = ['Scanner', 'Brute-forcer', 'Manual Attacker', 'Bot Network'];
  const countries = ['Russia', 'China', 'United States', 'Netherlands', 'Germany', 'Unknown'];
  const isps = ['DigitalOcean', 'Amazon AWS', 'OVH SAS', 'Hetzner', 'Unknown VPS Provider'];
  
  const attackTimeline = generateMockAttacks(20).map(attack => ({
    ...attack,
    attackerIP: ip,
  }));
  
  const endpointCounts: Record<string, number> = {};
  attackTimeline.forEach(attack => {
    endpointCounts[attack.targetEndpoint] = (endpointCounts[attack.targetEndpoint] || 0) + 1;
  });
  
  const targetedEndpoints = Object.entries(endpointCounts)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count);
  
  // Generate requests per minute data for last 60 minutes
  const requestsPerMinute = Array.from({ length: 60 }, () => 
    Math.floor(Math.random() * 50) + (Math.random() > 0.7 ? Math.floor(Math.random() * 100) : 0)
  );
  
  return {
    ip,
    riskScore: Math.floor(Math.random() * 40) + 60,
    classification: classifications[Math.floor(Math.random() * classifications.length)],
    firstSeen,
    lastSeen: now,
    totalRequests: Math.floor(Math.random() * 5000) + 500,
    requestsPerMinute,
    attackTimeline,
    targetedEndpoints,
    country: countries[Math.floor(Math.random() * countries.length)],
    isp: isps[Math.floor(Math.random() * isps.length)],
  };
};

export const getAttackStats = (attacks: Attack[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayAttacks = attacks.filter(a => a.timestamp >= today);
  const highRiskAttackers = new Set(
    attacks.filter(a => a.riskLevel === 'HIGH').map(a => a.attackerIP)
  ).size;
  
  const endpointCounts: Record<string, number> = {};
  attacks.forEach(attack => {
    endpointCounts[attack.targetEndpoint] = (endpointCounts[attack.targetEndpoint] || 0) + 1;
  });
  
  const mostTargeted = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])[0];
  
  return {
    totalToday: todayAttacks.length,
    highRiskAttackers,
    mostTargetedEndpoint: mostTargeted ? mostTargeted[0] : 'N/A',
    mostTargetedCount: mostTargeted ? mostTargeted[1] : 0,
  };
};

export const getAttackTypeDistribution = (attacks: Attack[]) => {
  const distribution: Record<string, number> = {};
  attacks.forEach(attack => {
    distribution[attack.attackType] = (distribution[attack.attackType] || 0) + 1;
  });
  
  return Object.entries(distribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const getTopEndpoints = (attacks: Attack[]) => {
  const counts: Record<string, number> = {};
  attacks.forEach(attack => {
    counts[attack.targetEndpoint] = (counts[attack.targetEndpoint] || 0) + 1;
  });
  
  return Object.entries(counts)
    .map(([endpoint, attacks]) => ({ endpoint, attacks }))
    .sort((a, b) => b.attacks - a.attacks)
    .slice(0, 5);
};

export const getHourlyAttackVolume = (attacks: Attack[]) => {
  const hourlyData: Record<number, number> = {};
  
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = 0;
  }
  
  attacks.forEach(attack => {
    const hour = attack.timestamp.getHours();
    hourlyData[hour] = (hourlyData[hour] || 0) + 1;
  });
  
  return Object.entries(hourlyData)
    .map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      attacks: count,
    }));
};
