from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from typing import Callable, Optional

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core import log_writer


def _get_client_ip(request: Request) -> str:
    # If you later put this behind a proxy, X-Forwarded-For is commonly used.
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # Take the first IP in the list.
        return xff.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


class StructuredRequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Non-negotiable telemetry layer:
    - Logs every request as one JSON entry (JSONL).
    - Fields match the required schema from the project brief.
    """

    def __init__(self, app, log_path: str):
        super().__init__(app)
        self.log_path = log_path

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start = time.perf_counter()

        # Read body once; Starlette caches it so endpoints can read again.
        body = await request.body()
        payload_size = len(body) if body else 0

        ip = _get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")

        status_code: int = 500
        auth_success: Optional[bool] = None

        try:
            response = await call_next(request)
            status_code = response.status_code
            auth_success = getattr(request.state, "auth_success", None)
            return response
        finally:
            duration_ms = int((time.perf_counter() - start) * 1000)

            # Required schema fields (do not remove/rename).
            event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "ip": ip,
                "endpoint": str(request.url.path),
                "method": request.method,
                "status_code": status_code,
                "auth_success": auth_success,
                "response_time_ms": duration_ms,
                "payload_size": payload_size,
                "user_agent": user_agent,
                "request_id": request_id,
            }

            # Fire-and-forget; logging must not break request handling.
            try:
                await log_writer.append_jsonl(self.log_path, event)
            except Exception:
                # Intentionally swallow exceptions to avoid "fixing" the honeypot
                # behavior at runtime due to logging failures.
                pass

