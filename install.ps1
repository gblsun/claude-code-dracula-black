# Instala o Midnight Synthwave para o Claude Code e o Windows Terminal.
# Uso: powershell -ExecutionPolicy Bypass -File .\install.ps1 [-Simular] [-SemTerminal] [-SemToque]
param([switch]$Simular, [switch]$SemTerminal, [switch]$SemToque)

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js não encontrado. Instale com: winget install OpenJS.NodeJS.LTS' -ForegroundColor Red
    Write-Host 'Depois abra um terminal novo e rode o instalador de novo.'
    exit 1
}

$opcoes = @()
if ($Simular) { $opcoes += '--simular' }
if ($SemTerminal) { $opcoes += '--sem-terminal' }
if ($SemToque) { $opcoes += '--sem-toque' }

node (Join-Path $PSScriptRoot 'install.mjs') @opcoes
exit $LASTEXITCODE
