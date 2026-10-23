import requests

url = "http://127.0.0.1:8000/protected"
response = requests.get(
    url,
    headers={"User-Agent": "python-requests"}
)

print("Requests Agent:", response.status_code)
print(response.text)