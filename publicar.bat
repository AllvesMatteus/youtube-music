@echo off
title Publicador de Atualizações - YouTube Music
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\publish.ps1"
pause
