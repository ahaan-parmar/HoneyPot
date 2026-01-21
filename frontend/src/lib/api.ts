import type { Attack, AttackerProfile } from '@/data/mockData';

type AttackDTO = Omit<Attack, 'timestamp'> & { timestamp: string };
type AttackerProfileDTO = Omit<AttackerProfile, 'firstSeen' | 'lastSeen' | 'attackTimeline'> & {
  firstSeen: string;
  lastSeen: string;
  attackTimeline: AttackDTO[];
};

type AnalyticsDTO = {
  attackTypeDistribution: { name: string; value: number }[];
  topEndpoints: { endpoint: string; attacks: number }[];
  hourlyAttackVolume: { hour: string; attacks: number }[];
};

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.toString() ||
  'http://127.0.0.1:8001';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

function toDate(value: string): Date {
  const d = new Date(value);
  // Fallback: if backend sends something unexpected, avoid crashing UI.
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export async function getAttacks(limit = 50): Promise<Attack[]> {
  const data = await fetchJson<{ attacks: AttackDTO[] }>(`/api/attacks?limit=${limit}`);
  return (data.attacks || []).map((a) => ({ ...a, timestamp: toDate(a.timestamp) }));
}

export async function getAttackerProfile(ip: string): Promise<AttackerProfile> {
  const data = await fetchJson<AttackerProfileDTO>(`/api/attacker/${encodeURIComponent(ip)}`);
  return {
    ...data,
    firstSeen: toDate(data.firstSeen),
    lastSeen: toDate(data.lastSeen),
    attackTimeline: (data.attackTimeline || []).map((a) => ({ ...a, timestamp: toDate(a.timestamp) })),
  };
}

export async function getAnalytics(): Promise<AnalyticsDTO> {
  return await fetchJson<AnalyticsDTO>('/api/analytics');
}

