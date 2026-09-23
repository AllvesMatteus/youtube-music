@echo off
chcp 65001 >nul
title YouTube Music - Painel Inteligente de Publicação
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] O processo foi encerrado ou cancelado.
    pause
)
