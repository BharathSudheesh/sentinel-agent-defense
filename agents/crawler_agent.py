import requests

url = "http://127.0.0.1:8000/protected"
response = requests.get(
    url,
    headers={"User-Agent": "demo-crawler"}
)

print("Crawler Agent:", response.status_code)
print(response.text)