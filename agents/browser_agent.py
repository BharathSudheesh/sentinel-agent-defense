
from playwright.sync_api import sync_playwright

URL = "https://sentinel-agent-defense.onrender.com/protected"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # Use a test marker to simulate a detectable browser agent
    context = browser.new_context(
        user_agent="playwright-demo-agent"
    )

    page = context.new_page()
    response = page.goto(URL)

    print("HTTP Status:", response.status if response else "No response")
    print("Response:", page.locator("body").inner_text())

    browser.close()
