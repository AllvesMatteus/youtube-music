param (
    [string]$TargetVersion = "",
    [string]$Notes = "",
    [switch]$SkipPrompt
)

$ErrorActionPreference = "Stop"

# Configura encoding UTF-8 no console para acentuacao perfeita
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# -------------------------------------------------------------
# 1. LOCALIZACAO DA RAIZ DO PROJETO (Busca recursiva por package.json)
# -------------------------------------------------------------
$scriptDir = $PSScriptRoot
$curr = $scriptDir
$rootDir = $null

while ($curr) {
    if (Test-Path (Join-Path $curr "package.json")) {
        $rootDir = $curr
        break
    }
    $parent = (Get-Item $curr).Parent
    if ($parent) { $curr = $parent.FullName } else { break }
}

if (-not $rootDir) {
    $rootDir = (Get-Location).Path
}

Set-Location $rootDir

# -------------------------------------------------------------
# 2. CARREGAR .ENV (Verifica na pasta do script e na raiz)
# -------------------------------------------------------------
$envLocations = @(
    (Join-Path $rootDir ".env"),
    (Join-Path $scriptDir ".env")
)

foreach ($loc in $envLocations) {
    if (Test-Path $loc) {
        Get-Content $loc -Encoding UTF8 | ForEach-Object {
            $line = $_.Trim()
            if ($line -and (-not $line.StartsWith("#")) -and ($line -match "^([^=]+)=(.*)$")) {
                $k = $matches[1].Trim()
                $v = $matches[2].Trim().Trim('"').Trim("'")
                if (-not [string]::IsNullOrEmpty($k)) {
                    [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
                }
            }
        }
        break
    }
}

# -------------------------------------------------------------
# 3. LEITURA DO package.json
# -------------------------------------------------------------
$pkgPath = Join-Path $rootDir "package.json"
if (-not (Test-Path $pkgPath)) {
    Write-Host "`n[ERRO CRITICO] package.json nao encontrado em: $rootDir" -ForegroundColor Red
    exit 1
}

$pkgJson = Get-Content $pkgPath -Raw -Encoding UTF8 | ConvertFrom-Json
$localVersion = $pkgJson.version

# Pega dados do repositorio
$owner = $env:GITHUB_OWNER
if ([string]::IsNullOrWhiteSpace($owner)) {
    if ($pkgJson.build -and $pkgJson.build.publish -and $pkgJson.build.publish.owner) {
        $owner = $pkgJson.build.publish.owner
    } else {
        $owner = "AllvesMatteus"
    }
}

$repo = $env:GITHUB_REPO
if ([string]::IsNullOrWhiteSpace($repo)) {
    if ($pkgJson.build -and $pkgJson.build.publish -and $pkgJson.build.publish.repo) {
        $repo = $pkgJson.build.publish.repo
    } else {
        $repo = "youtube-music"
    }
}

# Token do GitHub
$token = $env:GH_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
    $token = [System.Environment]::GetEnvironmentVariable('GH_TOKEN', 'User')
}
if ([string]::IsNullOrWhiteSpace($token)) {
    $token = [System.Environment]::GetEnvironmentVariable('GITHUB_TOKEN', 'Process')
}

# -------------------------------------------------------------
# 4. CONSULTA DA VERSAO REMOTA NO GITHUB RELEASES
# -------------------------------------------------------------
$githubVersion = "Nao identificada"
$githubDate = ""
$githubReleaseName = ""

if (-not [string]::IsNullOrWhiteSpace($token)) {
    try {
        $headers = @{
            "Authorization" = "token $token"
            "User-Agent"    = "YouTubeMusic-Publisher"
            "Accept"        = "application/vnd.github.v3+json"
        }
        $apiUrl = "https://api.github.com/repos/$owner/$repo/releases/latest"
        $latest = Invoke-RestMethod -Uri $apiUrl -Headers $headers -TimeoutSec 10 -ErrorAction Stop

        if ($latest -and $latest.tag_name) {
            $githubVersion = $latest.tag_name
            $githubReleaseName = $latest.name
            if ($latest.published_at) {
                $pDate = [DateTime]::Parse($latest.published_at)
                $githubDate = $pDate.ToString("dd/MM/yyyy HH:mm")
            }
        }
    } catch {
        $githubVersion = "Sem release publica encontrada no GitHub"
    }
} else {
    $githubVersion = "(GH_TOKEN nao configurado para consultar o GitHub)"
}

# -------------------------------------------------------------
# 5. DETECCAO DE ARQUIVOS ALTERADOS NO GIT
# -------------------------------------------------------------
$gitBranch = "main"
try {
    $b = (git branch --show-current 2>$null).Trim()
    if ($b) { $gitBranch = $b }
} catch {}

$changedFiles = @()
$rawStatus = git status --porcelain 2>$null
if ($rawStatus) {
    foreach ($line in $rawStatus) {
        $statusCode = $line.Substring(0, 2).Trim()
        $filePath = $line.Substring(3).Trim()

        $label = "MODIFICADO"
        $color = "Yellow"

        if ($statusCode -eq "??" -or $statusCode -match "A") {
            $label = "NOVO      "
            $color = "Green"
        } elseif ($statusCode -match "D") {
            $label = "EXCLUIDO  "
            $color = "Red"
        } elseif ($statusCode -match "R") {
            $label = "RENOMEADO "
            $color = "Cyan"
        }

        $changedFiles += [PSCustomObject]@{
            Label  = $label
            File   = $filePath
            Status = $statusCode
            Color  = $color
        }
    }
}

# -------------------------------------------------------------
# 6. EXIBICAO DO PAINEL INTELIGENTE
# -------------------------------------------------------------
Clear-Host
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "            YOUTUBE MUSIC DESKTOP - PAINEL INTELIGENTE DE PUBLICACAO           " -ForegroundColor White
Write-Host "================================================================================" -ForegroundColor Cyan

Write-Host "`n[1] STATUS ATUAL DO PROJETO:" -ForegroundColor Yellow
Write-Host "    * Repositorio GitHub : " -NoNewline -ForegroundColor Gray
Write-Host "$owner/$repo" -ForegroundColor White
Write-Host "    * Branch Atual       : " -NoNewline -ForegroundColor Gray
Write-Host "$gitBranch" -ForegroundColor White
Write-Host "    * Versao Local Atual : " -NoNewline -ForegroundColor Gray
Write-Host "v$localVersion (package.json)" -ForegroundColor Green
Write-Host "    * Ultima no GitHub   : " -NoNewline -ForegroundColor Gray
if ($githubDate) {
    Write-Host "$githubVersion (Publicada em $githubDate)" -ForegroundColor Cyan
} else {
    Write-Host "$githubVersion" -ForegroundColor Cyan
}

Write-Host "`n[2] ARQUIVOS ALTERADOS DETECTADOS NO REPOSITORIO:" -ForegroundColor Yellow
if ($changedFiles.Count -eq 0) {
    Write-Host "    [OK] Nenhuma alteracao pendente. Todos os arquivos estao commitados e limpos." -ForegroundColor Green
} else {
    Write-Host "    Foram detectadas alteracoes em $($changedFiles.Count) arquivo(s):`n" -ForegroundColor Gray
    foreach ($item in $changedFiles) {
        Write-Host "    [$($item.Label)] " -NoNewline -ForegroundColor $item.Color
        Write-Host "$($item.File)" -ForegroundColor White
    }
}

Write-Host "`n================================================================================" -ForegroundColor Gray

# -------------------------------------------------------------
# 7. CONFIRMACAO / SELECAO DE VERSAO
# -------------------------------------------------------------
# Calcula sugestoes SemVer
$vParts = $localVersion.Split('.')
$major = 1; $minor = 0; $patch = 0
if ($vParts.Length -ge 1) { [int]::TryParse($vParts[0], [ref]$major) | Out-Null }
if ($vParts.Length -ge 2) { [int]::TryParse($vParts[1], [ref]$minor) | Out-Null }
if ($vParts.Length -ge 3) { [int]::TryParse($vParts[2], [ref]$patch) | Out-Null }

$sugPatch = "$major.$minor.$($patch + 1)"
$sugMinor = "$major.$($minor + 1).0"
$sugMajor = "$($major + 1).0.0"

if (-not $TargetVersion) {
    Write-Host "`n[3] DESEJA ALTERAR A VERSAO DO APLICATIVO?" -ForegroundColor Yellow
    Write-Host "    Versao atual: v$localVersion" -ForegroundColor Gray
    Write-Host ""
    Write-Host "    [1] Patch (Correcoes de bugs / Pequenos ajustes) -> v$sugPatch (Recomendado)" -ForegroundColor White
    Write-Host "    [2] Minor (Novas funcionalidades / Melhorias)    -> v$sugMinor" -ForegroundColor White
    Write-Host "    [3] Major (Grande atualizacao estrutural)        -> v$sugMajor" -ForegroundColor White
    Write-Host "    [4] Manter a mesma versao                        -> v$localVersion" -ForegroundColor White
    Write-Host "    [5] Digitar uma versao personalizada" -ForegroundColor White

    Write-Host "`nEscolha uma opcao [1-5] ou pressione [ENTER] para aceitar a recomendada (v$sugPatch): " -NoNewline -ForegroundColor Yellow
    $choice = Read-Host

    switch ($choice.Trim()) {
        "1" { $TargetVersion = $sugPatch }
        "2" { $TargetVersion = $sugMinor }
        "3" { $TargetVersion = $sugMajor }
        "4" { $TargetVersion = $localVersion }
        "5" {
            $custom = Read-Host "Digite o numero da versao desejada (ex: 1.2.3)"
            if ([string]::IsNullOrWhiteSpace($custom)) { $TargetVersion = $sugPatch } else { $TargetVersion = $custom.Trim() }
        }
        default {
            if ([string]::IsNullOrWhiteSpace($choice)) {
                $TargetVersion = $sugPatch
            } else {
                $TargetVersion = $choice.Trim()
            }
        }
    }
}

$TargetVersion = $TargetVersion.TrimStart('v').Trim()

Write-Host "`n-> Versao confirmada para publicacao: " -NoNewline -ForegroundColor Gray
Write-Host "v$TargetVersion" -ForegroundColor Green

# -------------------------------------------------------------
# 8. NOTAS / CHANGELOG DA VERSAO
# -------------------------------------------------------------
if (-not $Notes) {
    Write-Host "`n[4] DESCRICAO DAS NOVIDADES (CHANGELOG):" -ForegroundColor Yellow
    Write-Host "Pressione [ENTER] para usar a mensagem padrao ou digite o resumo das novidades:" -ForegroundColor Gray
    $inputNotes = Read-Host "Mensagem da Release"
    if ([string]::IsNullOrWhiteSpace($inputNotes)) {
        if ($changedFiles.Count -gt 0) {
            $Notes = "Atualizacao v$TargetVersion com melhorias e correcoes"
        } else {
            $Notes = "Release v$TargetVersion - Estabilidade e melhorias gerais"
        }
    } else {
        $Notes = $inputNotes.Trim()
    }
}

# -------------------------------------------------------------
# 9. CONFIRMACAO ANTES DE EXECUTAR
# -------------------------------------------------------------
Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "RESUMO DA OPERACAO QUE SERA INICIADA:" -ForegroundColor White
Write-Host "  * Versao a publicar         : " -NoNewline -ForegroundColor Gray
Write-Host "v$TargetVersion" -ForegroundColor Green
Write-Host "  * Resumo das alteracoes     : " -NoNewline -ForegroundColor Gray
Write-Host "$Notes" -ForegroundColor White
Write-Host "  * Repositorio de destino    : " -NoNewline -ForegroundColor Gray
Write-Host "$owner/$repo ($gitBranch)" -ForegroundColor White
Write-Host "  * Acoes automaticas         : " -NoNewline -ForegroundColor Gray
Write-Host "Atualizar package.json -> Git Commit & Push -> Compilar -> Publicar Release" -ForegroundColor White
Write-Host "================================================================================" -ForegroundColor Cyan

if (-not $SkipPrompt) {
    Write-Host "`nConfirmar e iniciar a publicacao da versao v${TargetVersion}? (S/N): " -NoNewline -ForegroundColor Yellow
    $confirm = Read-Host
    if ($confirm.Trim().ToUpper() -ne "S" -and $confirm.Trim().ToUpper() -ne "SIM" -and $confirm.Trim() -ne "") {
        Write-Host "`nOperacao cancelada. Nenhuma alteracao foi feita no projeto.`n" -ForegroundColor Yellow
        exit 0
    }
}

# -------------------------------------------------------------
# 10. EXECUCAO DAS ETAPAS AUTOMATIZADAS
# -------------------------------------------------------------
$sw = [System.Diagnostics.Stopwatch]::StartNew()

# 10.1 Atualizar package.json
Write-Host "`n[Passo 1/5] Atualizando versao no package.json..." -ForegroundColor Cyan
$pkgContent = Get-Content $pkgPath -Raw -Encoding UTF8
$pkgContent = $pkgContent -replace '"version":\s*"[^"]+"', ('"version": "' + $TargetVersion + '"')
[System.IO.File]::WriteAllText($pkgPath, $pkgContent, [System.Text.Encoding]::UTF8)
Write-Host "  -> package.json atualizado para a versao $TargetVersion" -ForegroundColor Green

# 10.2 Atualizar README.md se existir
$readmePath = Join-Path $rootDir "README.md"
if (Test-Path $readmePath) {
    Write-Host "[Passo 2/5] Atualizando referencias no README.md..." -ForegroundColor Cyan
    $readmeContent = Get-Content $readmePath -Raw -Encoding UTF8
    $readmeContent = $readmeContent -replace 'version-[0-9.]+-red', ('version-' + $TargetVersion + '-red')
    $readmeContent = $readmeContent -replace 'Setup [0-9.]+\.exe', ("Setup $TargetVersion.exe")
    [System.IO.File]::WriteAllText($readmePath, $readmeContent, [System.Text.Encoding]::UTF8)
    Write-Host "  -> README.md sincronizado com a versao $TargetVersion" -ForegroundColor Green
} else {
    Write-Host "[Passo 2/5] README.md nao encontrado, prosseguindo..." -ForegroundColor Gray
}

# 10.3 Garante token nas variaveis de ambiente do processo
if (-not [string]::IsNullOrWhiteSpace($token)) {
    $env:GH_TOKEN = $token
    $env:GITHUB_TOKEN = $token
}

# 10.4 Git Commit e Push
Write-Host "`n[Passo 3/5] Sincronizando alteracoes com o GitHub (Git Add, Commit & Push)..." -ForegroundColor Cyan
git add -A
$commitMsg = "release: v$TargetVersion - $Notes"
git commit -m $commitMsg --allow-empty
git push origin $gitBranch
Write-Host "  -> Codigo-fonte sincronizado com sucesso na branch '$gitBranch'" -ForegroundColor Green

# 10.5 Compilar instalador e enviar para o GitHub Releases
Write-Host "`n[Passo 4/5] Compilando instalador e enviando binarios ao GitHub Releases..." -ForegroundColor Cyan
Write-Host "  (Gerando instalador .exe, latest.yml e efetuando upload)`n" -ForegroundColor Gray

npx electron-builder --win --publish always

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERRO CRITICO] electron-builder encerrou com erro: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 10.6 Garantir que a Release fique publica (draft: false)
Write-Host "`n[Passo 5/5] Finalizando status publico da Release no GitHub..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "token $token"
        "User-Agent"    = "YouTubeMusic-Publisher"
        "Accept"        = "application/vnd.github.v3+json"
    }
    $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/releases" -Headers $headers -TimeoutSec 15
    $targetRelease = $releases | Where-Object { $_.tag_name -eq "v$TargetVersion" -or $_.name -like "*$TargetVersion*" } | Select-Object -First 1

    if ($targetRelease -and $targetRelease.draft) {
        Write-Host "  -> Convertendo Release de rascunho para PUBLICA..." -ForegroundColor Yellow
        $patchBody = @{
            draft = $false
            name  = "YouTube Music v$TargetVersion"
            body  = "$Notes`n`n### O que ha de novo nesta versao:`n* $Notes"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/releases/$($targetRelease.id)" -Method Patch -Headers $headers -Body $patchBody | Out-Null
        Write-Host "  -> Release publicada oficialmente!" -ForegroundColor Green
    } else {
        Write-Host "  -> Release ja se encontra publica e ativa." -ForegroundColor Green
    }
} catch {
    Write-Host "  [Aviso] Nao foi possivel atualizar status via API: $($_.Exception.Message)" -ForegroundColor Yellow
}

$sw.Stop()
$totalMinutes = [Math]::Round($sw.Elapsed.TotalMinutes, 1)

# -------------------------------------------------------------
# 11. TELA FINAL DE SUCESSO
# -------------------------------------------------------------
Write-Host "`n================================================================================" -ForegroundColor Green
Write-Host "            ATUALIZACAO v$TargetVersion PUBLICADA COM SUCESSO NO GITHUB!         " -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "`n  * Tempo total de operacao: $totalMinutes minuto(s)" -ForegroundColor White
Write-Host "  * Pagina oficial da Release:" -ForegroundColor Gray
Write-Host "    https://github.com/$owner/$repo/releases/tag/v$TargetVersion" -ForegroundColor Cyan
Write-Host "`n  * Como seus usuarios receberao a atualizacao?" -ForegroundColor Yellow
Write-Host "    1. Ao abrirem o YouTube Music, o app verifica a versao no GitHub." -ForegroundColor White
Write-Host "    2. O novo instalador e baixado em segundo plano automaticamente." -ForegroundColor White
Write-Host "    3. O usuario e convidado a reiniciar e o app abre na versao v$TargetVersion!`n" -ForegroundColor White
