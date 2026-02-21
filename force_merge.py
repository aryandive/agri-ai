import os
import shutil
import subprocess

print("Fixing merge conflict...")

paths_to_remove = [
    r"backend/routers/__pycache__",
    r"backend\routers\__pycache__"
]

for p in paths_to_remove:
    # Remove from filesystem
    if os.path.exists(p):
        try:
            shutil.rmtree(p)
            print(f"Deleted {p} from disk")
        except:
            pass
    # Remove from git
    subprocess.run(["git", "rm", "-r", "--cached", p], capture_output=True)

# Add any remaining things
subprocess.run(["git", "add", "."])

# Complete the merge
res = subprocess.run(["git", "commit", "-m", "Merge main and resolve pycache/frontend conflicts"])
print("Git commit result:", res.returncode)
