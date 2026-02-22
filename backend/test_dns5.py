import httpx
import time

hostname = "ep-dark-wave-aiklvq3x-pooler.c-4.us-east-1.aws.neon.tech"

try:
    print(f"Requesting DoH via httpx for {hostname}...")
    start = time.time()
    
    # httpx bypasses urllib's WPAD issues and resolves directly if internet is available
    response = httpx.get(
        f"https://dns.google/resolve?name={hostname}",
        headers={'User-Agent': 'Mozilla/5.0'},
        timeout=5.0
    )
    
    data = response.json()
    print("Response:", data)
    host_ip = next((a['data'] for a in data.get('Answer', []) if a['type'] == 1), hostname)
    print(f"Success! IP: {host_ip} in {time.time()-start:.2f}s")
except Exception as e:
    print("Failed to resolve via httpx:", e)
