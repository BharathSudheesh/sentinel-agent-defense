
import logging
from collections import deque
from datetime import datetime, timezone
from threading import Lock

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from detector import detect_agent


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent-defense")

app = FastAPI(title="Agent Defense System")

# Keep the existing frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bharathsudheesh.github.io",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "null",
    ],
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

# In-memory activity history; resets when the backend restarts.
MAX_LOGS = 200
activity_logs = deque(maxlen=MAX_LOGS)
activity_lock = Lock()

allowed_count = 0
blocked_count = 0


def record_activity(
    request: Request,
    decision: str,
    status_code: int,
    reason: str,
) -> None:
    """Record one protected-endpoint access decision."""
    global allowed_count, blocked_count

    client_ip = (
        request.client.host if request.client else "unknown"
    )

    entry = {
        "time": datetime.now(timezone.utc).isoformat(),
        "decision": decision,
        "status_code": status_code,
        "reason": reason,
        "client": client_ip,
        "method": request.method,
        "endpoint": request.url.path,
        "user_agent": request.headers.get("user-agent", "unknown"),
    }

    with activity_lock:
        activity_logs.appendleft(entry)

        if decision == "ALLOW":
            allowed_count += 1
        else:
            blocked_count += 1

    logger.info(
        "PROTECTED PAGE | decision=%s | status=%s | ip=%s | reason=%s",
        decision,
        status_code,
        client_ip,
        reason,
    )


@app.get("/")
def home():
    return {
        "message": "Welcome! Website is accessible.",
        "status": "allowed",
    }


@app.get("/protected")
def protected_page(request: Request):
    user_agent = request.headers.get("user-agent", "")
    detected, reason = detect_agent(user_agent)

    if detected:
        record_activity(
            request=request,
            decision="BLOCK",
            status_code=403,
            reason=reason,
        )

        return JSONResponse(
            status_code=403,
            content={
                "message": "403 Forbidden: Agent access denied.",
                "status": "blocked",
                "reason": reason,
            },
        )

    record_activity(
        request=request,
        decision="ALLOW",
        status_code=200,
        reason=reason,
    )

    return {
        "message": "Access granted to protected content.",
        "status": "allowed",
    }


@app.get("/activity")
def get_activity():
    """Return recent logs and cumulative allow/block counters."""
    with activity_lock:
        logs = list(activity_logs)
        allowed = allowed_count
        blocked = blocked_count

    return {
        "counts": {
            "total": allowed + blocked,
            "allowed": allowed,
            "blocked": blocked,
        },
        "logs": logs,
    }
