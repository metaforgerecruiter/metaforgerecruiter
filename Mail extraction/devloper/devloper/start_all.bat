@echo off
cd /d "%~dp0"
echo [%date% %time%] Starting Auto Scheduler...
start "MetaForge Scheduler" cmd /k "start_scheduler.bat"
