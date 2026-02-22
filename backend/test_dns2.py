import urllib.request, json
hostname = "ep-dark-wave-aiklvq3x-pooler.c-4.us-east-1.aws.neon.tech"
try:
    req = urllib.request.Request(
        f"https://dns.google/resolve?name={hostname}",
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        data = json.loads(response.read().decode())
        print("Response:", data)
        host_ip = next((a['data'] for a in data.get('Answer', []) if a['type'] == 1), hostname)
        print("Success! IP:", host_ip)
except Exception as e:
    print("Failed to resolve via DoH:", e)
