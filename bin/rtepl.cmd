@echo off
cd /d "%~dp0../rtepl"
node --experimental-network-imports --no-warnings "%CD%/src/cli.js" %*
