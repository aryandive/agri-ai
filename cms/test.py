import urllib.request
import urllib.parse
import json

project_id = "zm4xq3z1"
dataset = "production"
query = urllib.parse.quote('*[_type == "product"]')

url = f"https://{project_id}.api.sanity.io/v2024-01-01/data/query/{dataset}?query={query}"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Total products:", len(data.get("result", [])))
        if data.get("result"):
            print("First product:", json.dumps(data["result"][0], indent=2))
except Exception as e:
    print("Error:", e)
