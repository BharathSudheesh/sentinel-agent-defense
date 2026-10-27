
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

# In-memory activity storage.
# Entries are lost when the backend restarts.
MAX_ACTIVITY_LOGS = 200
activity_logs = deque(maxlen=MAX_ACTIVITY_LOGS)
activity_lock = Lock()

total_requests = 0
allowed_count = 0
blocked_count = 0


def record_activity(
    decision: str,
    status_code: int,
    client_ip: str,
    reason: str,
) -> None:
    """Record a protected endpoint request and update counters."""
    global total_requests, allowed_count, blocked_count

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "decision": decision,
        "status_code": status_code,
        "client_ip": client_ip,
        "reason": reason,
    }

    with activity_lock:
        total_requests += 1

        if decision == "ALLOW":
            allowed_count += 1
        else:
            blocked_count += 1

        activity_logs.appendleft(entry)


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

    client_ip = (
        request.client.host if request.client else "unknown"
    )

    if detected:
        logger.warning(
            "PROTECTED PAGE | decision=BLOCK | status=403 "
            "| ip=%s | reason=%s",
            client_ip,
            reason,
        )

        record_activity(
            decision="BLOCK",
            status_code=403,
            client_ip=client_ip,
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

    logger.info(
        "PROTECTED PAGE | decision=ALLOW | status=200 "
        "| ip=%s | reason=%s",
        client_ip,
        reason,
    )

    record_activity(
        decision="ALLOW",
        status_code=200,
        client_ip=client_ip,
        reason=reason,
    )

    return {
        "message": "Access granted to protected content.",
        "status": "allowed",
    }


@app.get("/activity")
def get_activity():
    """Return request counters and recent protected-page activity."""
    with activity_lock:
        return {
            "total_requests": total_requests,
            "allowed_count": allowed_count,
            "blocked_count": blocked_count,
            "logs": list(activity_logs),
        }
