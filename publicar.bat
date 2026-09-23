@echo off
chcp 65001 >nul
title YouTube Music - Publicador de Atualizações
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\publish\publish.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
)
