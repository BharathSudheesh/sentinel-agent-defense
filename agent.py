
import httpx

URL = "http://127.0.0.1:8000/protected"

def run_agent():
    print("AI Agent: Attempting to access the website...")

    headers = {
        "User-Agent": "python-httpx"
    }

    response = httpx.get(URL, headers=headers)

    print(f"HTTP Status: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 403:
        print("Result: Agent blocked successfully!")
    else:
        print("Result: Access was not blocked.")

if __name__ == "__main__":
    run_agent()
