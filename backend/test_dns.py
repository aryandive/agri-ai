import socket
from urllib.parse import urlparse
url = "postgresql+asyncpg://neondb_owner:npg_r82jLKpFqHfv@ep-dark-wave-aiklvq3x-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
parsed = urlparse(url)
print("Hostname:", parsed.hostname)
try:
    host_ip = socket.gethostbyname(parsed.hostname)
    print("IP:", host_ip)
except Exception as e:
    print("Failed to resolve via socket:", e)

import urllib.request, json
try:
    r = urllib.request.urlopen("https://dns.google/resolve?name=" + parsed.hostname)
    print("DoH:", [a['data'] for a in json.load(r).get('Answer', []) if a['type']==1])
except Exception as e:
    print("Failed to resolve via DoH:", e)
