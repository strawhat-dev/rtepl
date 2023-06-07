@echo off
cd /d "%~dp0.."
node --experimental-network-imports --no-warnings "%CD%/src/cli.js" %*
