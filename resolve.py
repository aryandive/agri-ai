import os
import subprocess
print("Running python script to abort merge and remove pycache files")
try:
    subprocess.run(["git", "merge", "--abort"])
except Exception as e:
    print(f"Abort failed: {e}")

try:
    for root, dirs, files in os.walk("backend"):
        if "__pycache__" in dirs:
            pycache_dir = os.path.join(root, "__pycache__")
            print(f"Removing {pycache_dir} from git index")
            subprocess.run(["git", "rm", "-r", "--cached", pycache_dir])
except Exception as e:
    print(f"Error iterating: {e}")

print("Running git commit to clear unmerged status")
subprocess.run(["git", "commit", "-a", "-m", "fix: remove pycache from index before merge"])
print("Ready to merge.")
