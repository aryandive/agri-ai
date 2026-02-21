import subprocess

print("Applying git fix...")
subprocess.run(["git", "rm", "backend/routers/__pycache__/analyze.cpython-312.pyc"], capture_output=True)
subprocess.run(["git", "add", "."])
result = subprocess.run(["git", "commit", "-m", "Merge main and fix conflict"])
print("Complete. Git returned:", result.returncode)
