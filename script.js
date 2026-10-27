
const API = "https://chapter-payment-totals-accuracy.trycloudflare.com";

const accessButton = document.getElementById("access-button");
const result = document.getElementById("result");
const refreshButton = document.getElementById("refresh-activity");

function showResult(type, title, message, statusCode = null) {
    result.className = `result-box ${type}`;
    result.replaceChildren();

    const icon = document.createElement("span");
    icon.className = "result-icon";
    icon.textContent =
        type === "denied" ? "×" :
        type === "granted" ? "✓" :
        type === "loading" ? "↻" : "!";

    const content = document.createElement("div");

    const heading = document.createElement("strong");
    heading.textContent = statusCode !== null
        ? `${title} · HTTP ${statusCode}`
        : title;

    const description = document.createElement("p");
    description.textContent = message;

    content.append(heading, description);
    result.append(icon, content);
}

function formatTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value == null ? "—" : String(value);
    row.appendChild(cell);
    return cell;
}

async function checkServer() {
    const statusElement = document.getElementById("status");

    if (!statusElement) return;

    try {
        const response = await fetch(`${API}/`, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            statusElement.textContent = "Server Unavailable";
            return;
        }

        statusElement.textContent = "Connected";
    } catch {
        statusElement.textContent = "Connection Failed";
    }
}

async function testProtectedAccess() {
    if (!accessButton || !result) return;

    accessButton.disabled = true;

    showResult(
        "loading",
        "Checking access...",
        "Waiting for the protection server."
    );

    try {
        const response = await fetch(`${API}/protected`, {
            method: "GET",
            cache: "no-store"
        });

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        const denied =
            response.status === 403 ||
            data.status === "blocked";

        const title = denied
            ? "ACCESS DENIED"
            : response.ok
                ? "ACCESS GRANTED"
                : "REQUEST FAILED";

        const message = data.reason
            ? `${data.message || "Request evaluated."} Reason: ${data.reason}`
            : data.message || "The server returned no message.";

        showResult(
            denied ? "denied" : response.ok ? "granted" : "error",
            title,
            message,
            response.status
        );

        await refreshActivity();
    } catch {
        showResult(
            "error",
            "CONNECTION FAILED",
            "Could not reach the backend. Check the current Cloudflare Tunnel URL and ensure FastAPI is running."
        );
    } finally {
        accessButton.disabled = false;
    }
}

async function refreshActivity() {
    try {
        const response = await fetch(`${API}/activity`, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Activity endpoint returned HTTP ${response.status}`);
        }

        const data = await response.json();

        updateCounters(data);
        renderActivity(data);
        
        const updatedElement = document.getElementById("activity-updated");

        if (updatedElement) {
            updatedElement.textContent = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        }
    } catch {
        const rows = document.getElementById("activity-rows");

        if (rows && rows.children.length === 0) {
            rows.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        Activity unavailable. Check the backend and /activity endpoint.
                    </td>
                </tr>
            `;
        }
    }
}

function updateCounters(data) {
    const totalElement = document.getElementById("total-requests");
    const allowedElement = document.getElementById("allowed-count");
    const blockedElement = document.getElementById("blocked-count");

    if (totalElement) {
        totalElement.textContent = data.total_requests ?? 0;
    }

    if (allowedElement) {
        allowedElement.textContent = data.allowed_count ?? 0;
    }

    if (blockedElement) {
        blockedElement.textContent = data.blocked_count ?? 0;
    }
}

function renderActivity(data) {
    const rows = document.getElementById("activity-rows");

    if (!rows) return;

    rows.replaceChildren();

    const logs = Array.isArray(data.logs) ? data.logs : [];

    if (logs.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent = "No protected requests recorded yet.";

        row.appendChild(cell);
        rows.appendChild(row);
        return;
    }

    logs.forEach((log) => {
        const row = document.createElement("tr");

        addCell(row, formatTime(log.timestamp));

        const decisionCell = addCell(
            row,
            String(log.decision || "UNKNOWN").toUpperCase()
        );

        decisionCell.className =
            String(log.decision).toLowerCase() === "block"
                ? "decision-blocked"
                : "decision-allowed";

        addCell(row, log.status_code ?? "—");
        addCell(row, log.reason || "—");
        addCell(row, log.client_ip || "—");

        rows.appendChild(row);
    });
}

if (accessButton) {
    accessButton.addEventListener("click", testProtectedAccess);
}

if (refreshButton) {
    refreshButton.addEventListener("click", refreshActivity);
}

document.addEventListener("DOMContentLoaded", () => {
    checkServer();
    refreshActivity();
});
