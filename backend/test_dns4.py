import urllib.request, json
import time

hostname = "ep-dark-wave-aiklvq3x-pooler.c-4.us-east-1.aws.neon.tech"

try:
    print("Disabling proxy auto-discovery...")
    # Bypass Windows WPAD which causes 30s hangs
    proxy_handler = urllib.request.ProxyHandler({})
    opener = urllib.request.build_opener(proxy_handler)
    urllib.request.install_opener(opener)

    print(f"Requesting DoH for {hostname}...")
    start = time.time()
    req = urllib.request.Request(
        f"https://dns.google/resolve?name={hostname}",
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        data = json.loads(response.read().decode())
        print("Response:", data)
        host_ip = next((a['data'] for a in data.get('Answer', []) if a['type'] == 1), hostname)
        print(f"Success! IP: {host_ip} in {time.time()-start:.2f}s")
except Exception as e:
    print("Failed to resolve via DoH IP:", e)
