param (
    [string]$NewVersion = ""
)

$ErrorActionPreference = "Stop"

# Garante que o diretorio atual seja a raiz do projeto
$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   YOUTUBE MUSIC DESKTOP - PUBLICADOR DE ATUALIZACOES   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Le a versao atual do package.json
$pkgPath = Join-Path $rootDir "package.json"
$pkgJson = Get-Content $pkgPath -Raw | ConvertFrom-Json
$currentVersion = $pkgJson.version

Write-Host "`n[1/5] Versao atual instalada: v$currentVersion" -ForegroundColor Yellow

# Sugere incremento patch automatico (ex: 1.1.0 -> 1.1.1)
if ([string]::IsNullOrWhiteSpace($NewVersion)) {
    $versionParts = $currentVersion.Split('.')
    if ($versionParts.Length -ge 3) {
        $patchNum = [int]$versionParts[2] + 1
        $suggestedVersion = "$($versionParts[0]).$($versionParts[1]).$patchNum"
    } else {
        $suggestedVersion = "1.1.1"
    }

    Write-Host "Pressione [ENTER] para aceitar a versao sugerida ($suggestedVersion)" -ForegroundColor Gray
    $inputVersion = Read-Host "Ou digite a nova versao desejada"
    if ([string]::IsNullOrWhiteSpace($inputVersion)) {
        $NewVersion = $suggestedVersion
    } else {
        $NewVersion = $inputVersion.Trim()
    }
}

$NewVersion = $NewVersion.TrimStart('v')
Write-Host "`n-> Iniciando processo para a versao: v$NewVersion" -ForegroundColor Green

# 2. Atualiza package.json
$pkgContent = Get-Content $pkgPath -Raw
$pkgContent = $pkgContent -replace '"version":\s*"[^"]+"', ('"version": "' + $NewVersion + '"')
[System.IO.File]::WriteAllText($pkgPath, $pkgContent, [System.Text.Encoding]::UTF8)

# 3. Atualiza README.md se existir
$readmePath = Join-Path $rootDir "README.md"
if (Test-Path $readmePath) {
    $readmeContent = Get-Content $readmePath -Raw
    $readmeContent = $readmeContent -replace 'version-[0-9.]+-red', ('version-' + $NewVersion + '-red')
    $readmeContent = $readmeContent -replace 'Setup [0-9.]+\.exe', ("Setup $NewVersion.exe")
    [System.IO.File]::WriteAllText($readmePath, $readmeContent, [System.Text.Encoding]::UTF8)
}

# 4. Token do GitHub (lido das variaveis de ambiente do Windows)
$token = [System.Environment]::GetEnvironmentVariable('GH_TOKEN', 'User')
if ([string]::IsNullOrWhiteSpace($token)) {
    $token = $env:GH_TOKEN
}
if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "AVISO: GH_TOKEN nao encontrado no ambiente." -ForegroundColor Yellow
    $token = Read-Host "Cole aqui o seu Personal Access Token do GitHub (ghp_...)"
}
$env:GH_TOKEN = $token

# 5. Git Commit & Push
Write-Host "`n[2/5] Sincronizando codigo-fonte no GitHub..." -ForegroundColor Cyan
git add -A
git commit -m "release: v$NewVersion" --allow-empty
git push origin main

# 6. Compilacao e Upload dos Binarios no GitHub Releases
Write-Host "`n[3/5] Compilando instalador e enviando para o GitHub Releases..." -ForegroundColor Cyan
npx electron-builder --win --publish always

# 7. Publicacao da Release oficial
Write-Host "`n[4/5] Finalizando publicacao publica no GitHub..." -ForegroundColor Cyan
try {
    $headers = @{ "Authorization" = "token $token" }
    $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/AllvesMatteus/youtube-music/releases" -Headers $headers
    $targetRelease = $releases | Where-Object { $_.tag_name -eq "v$NewVersion" -or $_.name -like "*$NewVersion*" } | Select-Object -First 1
    if ($targetRelease -and $targetRelease.draft) {
        $patchBody = @{ draft = $false; name = "YouTube Music v$NewVersion" } | ConvertTo-Json
        Invoke-RestMethod -Uri "https://api.github.com/repos/AllvesMatteus/youtube-music/releases/$($targetRelease.id)" -Method Patch -Headers $headers -Body $patchBody | Out-Null
    }
} catch {
    Write-Host "Aviso ao verificar status da release: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "   ATUALIZACAO v$NewVersion PUBLICADA COM SUCESSO!      " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "`nLink da Release: https://github.com/AllvesMatteus/youtube-music/releases/tag/v$NewVersion" -ForegroundColor White
Write-Host "`nTodos os usuarios de versoes anteriores receberao" -ForegroundColor Cyan
Write-Host "esta atualizacao automaticamente ao abrir o app!`n" -ForegroundColor Cyan
