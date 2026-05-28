#!/usr/bin/env python3
import subprocess
import sys
import os
from pathlib import Path

project_dir = Path(__file__).parent
venv_dir = project_dir / "venv"
python_exe = venv_dir / "Scripts" / "python.exe"
pip_exe = venv_dir / "Scripts" / "pip.exe"

print("Creating virtual environment...")
subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], cwd=str(project_dir))

print("Upgrading pip...")
subprocess.run([str(pip_exe), "install", "--upgrade", "pip"], check=False)

print("Installing required packages...")
packages = ["djangorestframework", "web3", "pymongo", "python-dotenv"]
subprocess.run([str(pip_exe), "install"] + packages, check=False)

print("Generating requirements.txt...")
result = subprocess.run([str(pip_exe), "freeze"], capture_output=True, text=True)
with open(project_dir / "requirements.txt", "w") as f:
    f.write(result.stdout)

print("Verifying installation...")
result = subprocess.run(
    [str(python_exe), "-c", "import rest_framework, web3, pymongo, dotenv; print('All libraries installed successfully!')"],
    capture_output=True,
    text=True
)
print(result.stdout)
if result.stderr:
    print("Errors:", result.stderr)

print("Setup complete!")
