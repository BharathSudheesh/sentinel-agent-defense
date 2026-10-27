import requests

url = "https://sentinel-agent-defense.onrender.com/protected"
response = requests.get(
    url,
    headers={"User-Agent": "selenium-demo"}
)

print("Selenium Demo:", response.status_code)
print(response.text)