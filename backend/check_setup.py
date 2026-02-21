import sys
import os

print("="*60)
print("DIAGNOSTIC SCRIPT")
print("="*60)
print(f"1. Python Executable being used:\n   {sys.executable}")
print(f"\n2. Python Version:\n   {sys.version.split()[0]}")
print(f"\n3. Current Working Directory:\n   {os.getcwd()}")
print("\n4. Attempting to import packages...")

problems = []

try:
    import dotenv
    print(f"   [OK] dotenv found at: {dotenv.__file__}")
except ImportError:
    print("   [FAIL] 'dotenv' NOT found.")
    problems.append("python-dotenv")

try:
    import fastapi
    print(f"   [OK] fastapi found at: {fastapi.__file__}")
except ImportError:
    print("   [FAIL] 'fastapi' NOT found.")
    problems.append("fastapi")

print("="*60)
if problems:
    print("FIX COMMAND:")
    print("Run the following command EXACTLY as shown to install missing packages")
    print("into THIS specific python environment:")
    print("")
    print(f'"{sys.executable}" -m pip install {" ".join(problems)}')
    print("")
else:
    print("Everything seems correct! If you still see errors in your IDE,")
    print("make sure your IDE is using this python executable:")
    print(f"{sys.executable}")
print("="*60)
