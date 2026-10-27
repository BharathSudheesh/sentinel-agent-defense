import requests

url = "https://sentinel-agent-defense.onrender.com/protected"
response = requests.get(
    url,
    headers={"User-Agent": "python-requests"}
)

print("Requests Agent:", response.status_code)
print(response.text)