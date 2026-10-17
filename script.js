const API = "https://bikini-roman-ware-likelihood.trycloudflare.com";
document.getElementById("access-button").addEventListener("click", async () => {
    const result = document.getElementById("result");

    result.className = "result-box";
    result.innerHTML = `
        <span class="result-icon">↻</span>
        <div>
            <strong>Checking access...</strong>
            <p>Waiting for the server response.</p>
        </div>
    `;

    try {
        const response = await fetch(`${API}/protected`);
        const data = await response.json();

        const denied = response.status === 403 || data.status === "blocked";
        const title = denied
            ? `ACCESS DENIED · HTTP ${response.status}`
            : response.ok
                ? `ACCESS GRANTED · HTTP ${response.status}`
                : `REQUEST FAILED · HTTP ${response.status}`;

        result.className = `result-box ${denied ? "denied" : response.ok ? "granted" : "error"}`;

        result.innerHTML = "";

        const icon = document.createElement("span");
        icon.className = "result-icon";
        icon.textContent = denied ? "✕" : response.ok ? "✓" : "!";

        const content = document.createElement("div");
        const heading = document.createElement("strong");
        heading.textContent = title;

        const message = document.createElement("p");
        message.textContent = data.reason
            ? `${data.message} Reason: ${data.reason}`
            : data.message || "The server returned no message.";

        content.append(heading, message);
        result.append(icon, content);
    } catch {
        result.className = "result-box error";
        result.innerHTML = `
            <span class="result-icon">!</span>
            <div>
                <strong>CONNECTION FAILED</strong>
                <p>Check that the backend is running on port 8000.</p>
            </div>
        `;
    }
});
