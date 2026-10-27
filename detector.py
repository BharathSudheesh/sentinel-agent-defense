
def detect_agent(user_agent: str) -> tuple[bool, str]:
    """
    Detect known automation tools using User-Agent markers.

    Returns:
        (True, marker) if a known automation marker is found.
        (False, "no_known_marker") otherwise.

    Limitation:
        User-Agent detection alone cannot reliably identify every
        automated or AI-powered agent.
    """

    indicators = [
        "python-requests",
        "python-httpx",
        "playwright",
        "selenium",
        "headlesschrome",
        "demo-crawler",
    ]

    normalized_user_agent = (user_agent or "").lower()

    for marker in indicators:
        if marker in normalized_user_agent:
            return True, marker

    return False, "no_known_marker"
