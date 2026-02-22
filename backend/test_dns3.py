import urllib.request, json
import ssl

hostname = "ep-dark-wave-aiklvq3x-pooler.c-4.us-east-1.aws.neon.tech"

try:
    # Disable SSL verification since we use an IP instead of the hostname 'dns.google'
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(
        f"https://8.8.8.8/resolve?name={hostname}",
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, timeout=5, context=ctx) as response:
        data = json.loads(response.read().decode())
        print("Response:", data)
        host_ip = next((a['data'] for a in data.get('Answer', []) if a['type'] == 1), hostname)
        print("Success! IP:", host_ip)
except Exception as e:
    print("Failed to resolve via DoH IP:", e)
