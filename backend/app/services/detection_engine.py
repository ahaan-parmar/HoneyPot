from __future__ import annotations

import json
import os
import re
import time
from collections import Counter, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Deque, Dict, Iterable, List, Optional, Tuple


# Frontend expects these enums (from mockData.ts)
AttackType = str
RiskLevel = str  # "LOW" | "MEDIUM" | "HIGH"
AttackerClassification = str  # "Scanner" | "Brute-forcer" | "Manual Attacker"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_ts(s: Optional[str]) -> datetime:
    if not s:
        return _utc_now()
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return _utc_now()


def _risk_level(score: int) -> RiskLevel:
    if score >= 80:
        return "HIGH"
    if score >= 50:
        return "MEDIUM"
    return "LOW"


_RE_USER_ID = re.compile(r"^/api/users/(\d+)$")


@dataclass
class AttackerState:
    ip: str
    first_seen: datetime
    last_seen: datetime
    total_requests: int = 0

    # Rolling windows (timestamps in epoch seconds).
    recent_requests_s: Deque[float] = field(default_factory=lambda: deque(maxlen=5000))
    recent_failed_logins_s: Deque[float] = field(default_factory=lambda: deque(maxlen=5000))

    # IDOR enumeration tracking.
    last_user_id: Optional[int] = None
    sequential_id_hits: int = 0

    endpoint_counts: Counter = field(default_factory=Counter)

    risk_score: int = 10
    # Behavior counters for explainability / classification.
    behavior_counts: Counter = field(default_factory=Counter)  # keys: AttackType
    recon_hits: int = 0
    brute_force_emits: int = 0
    # Recent emitted attack types for classification (ts_s, attackType)
    recent_attack_types: Deque[Tuple[float, str]] = field(default_factory=lambda: deque(maxlen=2000))


class DetectionEngine:
    """
    Rule-first behavior detector.

    It processes structured request events (from requests.jsonl) and emits
    "attack events" the frontend can display.
    """

    def __init__(self) -> None:
        self._attack_events: Deque[Dict[str, Any]] = deque(maxlen=500)
        self._attackers: Dict[str, AttackerState] = {}
        self._file_pos: int = 0
        self._last_tail_ts: float = 0.0

    # -------------------------
    # Public API used by routes
    # -------------------------

    def get_recent_attacks(self, limit: int = 50) -> List[Dict[str, Any]]:
        items = list(self._attack_events)
        return list(reversed(items[-max(1, limit) :]))

    def get_attacker_profile(self, ip: str) -> Dict[str, Any]:
        st = self._attackers.get(ip)
        now = _utc_now()
        if not st:
            return {
                "ip": ip,
                "riskScore": 0,
                "classification": "Scanner",
                "firstSeen": now.isoformat(),
                "lastSeen": now.isoformat(),
                "totalRequests": 0,
                "requestsPerMinute": [0] * 60,
                "attackTimeline": [],
                "targetedEndpoints": [],
                "country": "Unknown",
                "isp": "Unknown",
            }

        classification = self._classify(st)
        rpm = self._requests_per_minute(st, now)
        timeline = self._timeline_for_ip(ip, limit=20)
        targeted = [
            {"endpoint": ep, "count": count}
            for ep, count in st.endpoint_counts.most_common()
        ]

        return {
            "ip": ip,
            "riskScore": max(0, min(100, st.risk_score)),
            "classification": classification,
            "firstSeen": st.first_seen.isoformat(),
            "lastSeen": st.last_seen.isoformat(),
            "totalRequests": st.total_requests,
            "requestsPerMinute": rpm,
            "attackTimeline": timeline,
            "targetedEndpoints": targeted,
            "country": "Unknown",
            "isp": "Unknown",
        }

    def get_analytics(self) -> Dict[str, Any]:
        dist = Counter()
        ep_counts = Counter()
        hourly = {h: 0 for h in range(24)}

        for ev in self._attack_events:
            dist[ev.get("attackType", "API Abuse")] += 1
            ep_counts[ev.get("targetEndpoint", "")] += 1
            ts = _parse_ts(ev.get("timestamp"))
            hourly[ts.hour] = hourly.get(ts.hour, 0) + 1

        return {
            "attackTypeDistribution": [
                {"name": k, "value": v} for k, v in dist.most_common()
            ],
            "topEndpoints": [
                {"endpoint": k, "attacks": v} for k, v in ep_counts.most_common(5)
            ],
            "hourlyAttackVolume": [
                {"hour": f"{h:02d}:00", "attacks": hourly.get(h, 0)} for h in range(24)
            ],
        }

    # -------------------------
    # Tailing / ingestion
    # -------------------------

    def tail_once(self, log_path: str) -> int:
        """
        Read and process any new JSONL lines since last position.
        Returns number of processed lines.
        """
        if not os.path.exists(log_path):
            return 0

        processed = 0
        with open(log_path, "r", encoding="utf-8") as f:
            f.seek(self._file_pos)
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except Exception:
                    continue
                self.process_request_event(event)
                processed += 1
            self._file_pos = f.tell()
        self._last_tail_ts = time.time()
        return processed

    def process_request_event(self, e: Dict[str, Any]) -> None:
        ip = str(e.get("ip") or "unknown")
        endpoint = str(e.get("endpoint") or "")
        ts = _parse_ts(e.get("timestamp"))
        ts_s = ts.timestamp()

        st = self._attackers.get(ip)
        if not st:
            st = AttackerState(ip=ip, first_seen=ts, last_seen=ts)
            self._attackers[ip] = st

        st.last_seen = ts
        st.total_requests += 1
        st.recent_requests_s.append(ts_s)
        st.endpoint_counts[endpoint] += 1

        status = int(e.get("status_code") or 200)
        auth_success = e.get("auth_success", None)

        # ---- Rules (behavior-first) ----
        # Recon / traversal-ish endpoints (very common honeypot noise)
        if endpoint in ("/.env", "/wp-admin/admin-ajax.php", "/wp-admin") or ".." in endpoint:
            st.recon_hits += 1
            self._recompute_risk(st, ts_s)
            self._emit(st, e, attack_type="Path Traversal")
            return

        # Brute force: failed login tracking
        if endpoint == "/login" and auth_success is False:
            st.recent_failed_logins_s.append(ts_s)
            # window: last 60 seconds
            self._prune_older_than(st.recent_failed_logins_s, ts_s - 60)
            self._recompute_risk(st, ts_s)
            if len(st.recent_failed_logins_s) >= 10:
                # Only /login failures should be marked brute force.
                # Reduce spam: emit every 3rd failed login after threshold.
                st.brute_force_emits += 1
                if st.brute_force_emits % 3 == 0:
                    self._emit(st, e, attack_type="Brute Force")
                return
            # still suspicious but lower
            self._emit(st, e, attack_type="Credential Stuffing")
            return

        # IDOR enumeration: sequential user IDs
        m = _RE_USER_ID.match(endpoint)
        if m:
            user_id = int(m.group(1))
            if st.last_user_id is not None and user_id == st.last_user_id + 1:
                st.sequential_id_hits += 1
            else:
                st.sequential_id_hits = 0
            st.last_user_id = user_id
            self._recompute_risk(st, ts_s)

            # Mark IDOR as soon as we see a sequence starting (less confusing),
            # but only after at least 2 steps to avoid false positives.
            if st.sequential_id_hits >= 1:
                self._emit(st, e, attack_type="IDOR")
                return

        # High-frequency API abuse: > 120 requests/min
        self._prune_older_than(st.recent_requests_s, ts_s - 60)
        self._recompute_risk(st, ts_s)
        if len(st.recent_requests_s) > 120:
            self._emit(st, e, attack_type="API Abuse")
            return

        # Default: scanner-ish if they’re probing many endpoints quickly
        if status >= 400:
            # A single 404 shouldn't become HIGH risk. Keep it low.
            self._emit(st, e, attack_type="Scanner")
            return

        # Non-malicious-looking requests are not emitted as "attacks" to reduce noise.

    # -------------------------
    # Helpers
    # -------------------------

    def _emit(self, st: AttackerState, e: Dict[str, Any], attack_type: AttackType) -> None:
        st.behavior_counts[attack_type] += 1
        risk = _risk_level(st.risk_score)
        payload_preview: Optional[str] = None

        ts = _parse_ts(e.get("timestamp")).timestamp()
        st.recent_attack_types.append((ts, attack_type))
        self._prune_recent_attack_types(st, ts - 600)  # keep last 10 minutes for classification

        self._attack_events.append(
            {
                "id": e.get("request_id") or f"{st.ip}-{int(time.time()*1000)}",
                "timestamp": e.get("timestamp"),
                "attackerIP": st.ip,
                "targetEndpoint": e.get("endpoint"),
                "attackType": attack_type,
                "riskLevel": risk,
                "userAgent": e.get("user_agent", ""),
                "payload": payload_preview,
            }
        )

    def _prune_older_than(self, dq: Deque[float], threshold: float) -> None:
        while dq and dq[0] < threshold:
            dq.popleft()

    def _recompute_risk(self, st: AttackerState, now_s: float) -> None:
        """
        Explainable risk score based on *recent* behavior (last ~60s),
        instead of permanently accumulating to 100.
        """
        # Make sure windows are current.
        self._prune_older_than(st.recent_failed_logins_s, now_s - 60)
        self._prune_older_than(st.recent_requests_s, now_s - 60)

        failed_60s = len(st.recent_failed_logins_s)
        rpm = len(st.recent_requests_s)
        seq = st.sequential_id_hits

        score = 10
        # Keep scores realistic: 10 failed logins should push into HIGH, not instantly to 100.
        score += min(40, failed_60s * 4)           # brute force pressure (cap 40)
        score += min(24, seq * 6)                  # IDOR enumeration streak (cap 24)
        score += min(20, max(0, rpm - 80) // 8)    # rate abuse only after 80 rpm
        score += min(15, st.recon_hits * 3)        # recon/traversal indicators (cap 15)

        st.risk_score = max(0, min(100, score))

    def _classify(self, st: AttackerState) -> AttackerClassification:
        """
        Explainable, rule-first classification based on RECENT (last 10 minutes) behavior.
        This avoids "sticky" labels where one brute-force burst marks the IP forever.
        """
        now_s = _utc_now().timestamp()
        self._prune_recent_attack_types(st, now_s - 600)

        counts = Counter(t for _, t in st.recent_attack_types)
        # Count brute-force pressure from *requests*, not only emitted events (we throttle emits).
        brute = counts.get("Brute Force", 0) + counts.get("Credential Stuffing", 0)
        idor = counts.get("IDOR", 0)
        recon = counts.get("Path Traversal", 0) + counts.get("Scanner", 0)
        abuse = counts.get("API Abuse", 0)

        # Dominant-pattern classification (simple + viva-friendly).
        if (len(st.recent_failed_logins_s) >= 10) or (brute >= 3 and brute >= max(idor, abuse, recon)):
            return "Brute-forcer"
        if idor >= 3 and idor >= max(brute, abuse, recon):
            return "Manual Attacker"
        return "Scanner"

    def _prune_recent_attack_types(self, st: AttackerState, threshold: float) -> None:
        while st.recent_attack_types and st.recent_attack_types[0][0] < threshold:
            st.recent_attack_types.popleft()

    def _requests_per_minute(self, st: AttackerState, now: datetime) -> List[int]:
        now_s = now.timestamp()
        buckets = [0] * 60
        for ts_s in st.recent_requests_s:
            delta_min = int((now_s - ts_s) // 60)
            if 0 <= delta_min < 60:
                buckets[59 - delta_min] += 1
        return buckets

    def _timeline_for_ip(self, ip: str, limit: int = 20) -> List[Dict[str, Any]]:
        out = []
        for ev in reversed(self._attack_events):
            if ev.get("attackerIP") == ip:
                out.append(ev)
                if len(out) >= limit:
                    break
        return list(reversed(out))

