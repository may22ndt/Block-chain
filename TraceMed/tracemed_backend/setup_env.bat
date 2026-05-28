@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing required packages...
python -m pip install djangorestframework web3 pymongo python-dotenv

echo Generating requirements.txt...
python -m pip freeze > requirements.txt

echo Verifying installation...
python -c "import rest_framework, web3, pymongo, dotenv; print('All libraries installed successfully!')"

echo.
echo Setup complete!
echo To activate venv in future, run: venv\Scripts\activate.bat
pause
