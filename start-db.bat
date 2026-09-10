@echo off
echo Starting local MongoDB for KISANOVA...
if not exist "%USERPROFILE%\.mongo_kisanova" mkdir "%USERPROFILE%\.mongo_kisanova"
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "%USERPROFILE%\.mongo_kisanova" --bind_ip 127.0.0.1 --port 27017
pause
