#!/usr/bin/env pwsh
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Creating virtual environment..."
python -m venv venv

Write-Host "Upgrading pip..."
& .\venv\Scripts\pip.exe install --upgrade pip

Write-Host "Installing required packages..."
& .\venv\Scripts\pip.exe install djangorestframework web3 pymongo python-dotenv

Write-Host "Generating requirements.txt..."
& .\venv\Scripts\pip.exe freeze > requirements.txt

Write-Host "Verifying installation..."
& .\venv\Scripts\python.exe -c "import rest_framework, web3, pymongo, dotenv; print('All libraries installed successfully!')"

Write-Host "Setup complete!"
