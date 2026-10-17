def detect_agent(user_agent: str) -> tuple[bool, str]:
    """
    Detect known automation markers in a User-Agent string.

    Returns:
        (True, marker) if a known marker is found.
        (False, "no_known_marker") otherwise.

    Note: This cannot reliably identify every AI agent.
    """

    indicators = [
        "python-requests",
        "python-httpx",
        "playwright",
        "selenium",
        "headlesschrome",
        "demo-crawler",
    ]

    user_agent = (user_agent or "").lower()

    for marker in indicators:
        if marker in user_agent:
            return True, marker

    return False, "no_known_marker"