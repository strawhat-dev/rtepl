@echo off
cd /d "%~dp0.."
node --experimental-network-imports --no-warnings "%CD%/rtepl/src/cli.js" %*
