import requests

url = "https://sentinel-agent-defense.onrender.com/protected"
response = requests.get(
    url,
    headers={"User-Agent": "demo-crawler"}
)

print("Crawler Agent:", response.status_code)
print(response.text)