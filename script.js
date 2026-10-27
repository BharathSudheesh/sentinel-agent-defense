
const API = "https://sentinel-agent-defense.onrender.com";
const REFRESH_INTERVAL_MS = 5000;

const accessButton = document.getElementById("access-button");
const result = document.getElementById("result");
const statusElement = document.getElementById("status");

const totalRequestsElement = document.getElementById("total-requests");
const allowedCountElement = document.getElementById("allowed-count");
const blockedCountElement = document.getElementById("blocked-count");

const activityRowsElement = document.getElementById("activity-rows");
const activityUpdatedElement = document.getElementById("activity-updated");
const refreshActivityButton = document.getElementById("refresh-activity");


function setResult(title, message, decision = "neutral") {
    if (!result) return;

    result.className = `result-box ${decision}`;
    result.replaceChildren();

    const heading = document.createElement("strong");
    heading.textContent = title;

    const detail = document.createElement("p");
    detail.textContent = message;

    result.append(heading, detail);
}


async function readResponse(response) {
    const text = await response.text();

    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return {
            message: text || "The server returned an empty response."
        };
    }
}


async function checkServer() {
    try {
        const response = await fetch(`${API}/`, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        if (statusElement) {
            statusElement.textContent = "Online";
        }

        return true;
    } catch (error) {
        if (statusElement) {
            statusElement.textContent = "Connection unavailable";
        }

        console.error("Sentinel backend connection failed:", error);
        return false;
    }
}


async function testProtectedAccess() {
    if (!accessButton) return;

    accessButton.disabled = true;
    accessButton.classList.add("testing");

    setResult(
        "Checking protected access…",
        "Waiting for the backend to evaluate this request.",
        "neutral"
    );

    try {
        const response = await fetch(`${API}/protected`, {
            method: "GET",
            cache: "no-store"
        });

        const data = await readResponse(response);

        const blocked =
            response.status === 403 ||
            data.status === "blocked";

        if (blocked) {
            setResult(
                `Access Denied — HTTP ${response.status}`,
                `${data.message || "The request was blocked."} Reason: ${data.reason || "Detection rule matched."}`,
                "denied"
            );
        } else if (response.ok) {
            setResult(
                `Access Granted — HTTP ${response.status}`,
                data.message || "Access granted to protected content.",
                "granted"
            );
        } else {
            setResult(
                `Request Failed — HTTP ${response.status}`,
                data.message || "The backend returned an unexpected response.",
                "error"
            );
        }
    } catch (error) {
        setResult(
            "Connection Failed",
            "Could not reach the backend. Check that FastAPI is running and the Cloudflare Tunnel URL is active.",
            "error"
        );

        console.error("Protected access test failed:", error);
    } finally {
        accessButton.disabled = false;
        accessButton.classList.remove("testing");

        await refreshActivity();
    }
}


async function refreshActivity() {
    if (!activityRowsElement) return;

    if (refreshActivityButton) {
        refreshActivityButton.disabled = true;
    }

    try {
        const response = await fetch(`${API}/activity`, {
            method: "GET",
            cache: "no-store"
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(
                `Activity endpoint returned HTTP ${response.status}`
            );
        }

        const counts = data.counts || {};

        if (totalRequestsElement) {
            totalRequestsElement.textContent = counts.total ?? 0;
        }

        if (allowedCountElement) {
            allowedCountElement.textContent = counts.allowed ?? 0;
        }

        if (blockedCountElement) {
            blockedCountElement.textContent = counts.blocked ?? 0;
        }

        activityRowsElement.replaceChildren();

        const logs = Array.isArray(data.logs) ? data.logs : [];

        if (logs.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.className = "empty-state";
            cell.textContent = "No protected requests recorded yet.";

            row.appendChild(cell);
            activityRowsElement.appendChild(row);
        } else {
            for (const entry of logs) {
                const row = document.createElement("tr");

                const timeCell = document.createElement("td");
                const decisionCell = document.createElement("td");
                const statusCell = document.createElement("td");
                const reasonCell = document.createElement("td");
                const clientCell = document.createElement("td");

                const date = entry.time
                    ? new Date(entry.time)
                    : null;

                timeCell.textContent =
                    date && !Number.isNaN(date.getTime())
                        ? date.toLocaleTimeString()
                        : "—";

                const decisionText = (
                    entry.decision || "UNKNOWN"
                ).toUpperCase();

                const decision = document.createElement("span");

                decision.className =
                    decisionText === "ALLOW"
                        ? "decision-allow"
                        : decisionText === "BLOCK"
                            ? "decision-block"
                            : "";

                decision.textContent = decisionText;
                decisionCell.appendChild(decision);

                const statusCode = entry.status_code;

                statusCell.textContent =
                    statusCode != null ? statusCode : "—";

                statusCell.className =
                    Number(statusCode) === 200
                        ? "status-200"
                        : Number(statusCode) === 403
                            ? "status-403"
                            : "";

                reasonCell.textContent = entry.reason || "—";
                clientCell.textContent = entry.client || "—";

                row.append(
                    timeCell,
                    decisionCell,
                    statusCell,
                    reasonCell,
                    clientCell
                );

                row.classList.toggle(
                    "activity-allowed",
                    decisionText === "ALLOW"
                );

                row.classList.toggle(
                    "activity-blocked",
                    decisionText === "BLOCK"
                );

                activityRowsElement.appendChild(row);
            }
        }

        if (activityUpdatedElement) {
            activityUpdatedElement.textContent =
                `Last updated ${new Date().toLocaleTimeString()}`;
        }

        if (statusElement) {
            statusElement.textContent = "Online";
        }
    } catch (error) {
        if (activityUpdatedElement) {
            activityUpdatedElement.textContent = "Activity unavailable";
        }

        activityRowsElement.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-state";
        cell.textContent =
            "Cannot load activity. Check the backend and Cloudflare Tunnel.";

        row.appendChild(cell);
        activityRowsElement.appendChild(row);

        console.error("Could not refresh activity:", error);
    } finally {
        if (refreshActivityButton) {
            refreshActivityButton.disabled = false;
        }
    }
}


if (accessButton) {
    accessButton.addEventListener("click", testProtectedAccess);
}

if (refreshActivityButton) {
    refreshActivityButton.addEventListener("click", refreshActivity);
}


async function initializeSentinel() {
    await checkServer();
    await refreshActivity();

    window.setInterval(async () => {
        await checkServer();
        await refreshActivity();
    }, REFRESH_INTERVAL_MS);
}

initializeSentinel();
