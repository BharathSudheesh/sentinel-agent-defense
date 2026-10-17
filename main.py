
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from detector import detect_agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent-defense")

app = FastAPI(title="Agent Defense System")

# Allow your local Live Server frontend to access the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
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

    return {
        "message": "Access granted to protected content.",
        "status": "allowed",
    }
