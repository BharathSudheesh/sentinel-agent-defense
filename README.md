::: {align="center"}
# 🛡️ SENTINEL

### Agent Defense System

**Detect known automation markers. Protect restricted resources. Control
access.**

`REQUEST` → `DETECT` → `DECIDE`
:::

------------------------------------------------------------------------

## 📌 Project Summary

**Sentinel** is a web security prototype that checks requests to a
protected endpoint. It inspects the request's `User-Agent` for known
automation markers and then allows or blocks access.

## 🧪 How to Test Sentinel

### Scenario 1 --- Normal User

1.  Open the Sentinel website.
2.  Click **Test Protected Access**.
3.  The website sends an HTTP request to the backend's `/protected`
    endpoint.
4.  If the request contains no recognized automation marker, access is
    allowed.

**Expected result:** `HTTP 200 — Access Granted`

### Scenario 2 --- Automated Agent

1.  Open the repository's `agents/` folder.
2.  Run one of the Python demonstration scripts.
3.  The script sends a request to the backend's `/protected` endpoint.
4.  The backend checks the request's `User-Agent`.
5.  If a known automation marker is found, the request is blocked.

**Expected result:** `HTTP 403 — Access Denied`

  Agent script          What it demonstrates
  --------------------- -------------------------------------------
  `agent.py`            Direct HTTP request using HTTPX
  `requests_agent.py`   Direct HTTP request using Python Requests
  `browser_agent.py`    Browser automation using Playwright
  `selenium_agent.py`   Browser automation using Selenium
  `crawler_agent.py`    Simulated web crawler request

> **Note:** The result depends on the `User-Agent` actually sent by each
> script. Requests without a recognized marker may be allowed.

## 🚀 Future Enhancements

-   **Behavioral Analysis** --- detect suspicious request patterns.
-   **Authentication & Authorization** --- verify who can access
    restricted resources.
-   **URL and Request Inspection** --- inspect requests for suspicious
    activity.
-   **Rate Limiting** --- limit repeated or abusive requests.
-   **Improved Monitoring** --- provide clearer security logs and
    activity reporting.


------------------------------------------------------------------------

::: {align="center"}
*Sentinel --- Request. Detect. Decide.*
:::
