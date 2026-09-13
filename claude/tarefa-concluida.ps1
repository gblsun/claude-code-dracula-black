# Toque de "tarefa concluída" do Claude Code: notificação do Windows e som próprio.
# Chamado pelo hook Stop, que envia o JSON do evento pela entrada padrão.
# Respostas rápidas (menos de $SegundosMinimos) não disparam nada.
param([int]$SegundosMinimos = 15)

[Console]::InputEncoding = [Text.Encoding]::UTF8
$evento = [Console]::In.ReadToEnd() | ConvertFrom-Json

# Sem mensagem final (ex.: /clear) não há tarefa para avisar.
if (-not $evento.last_assistant_message) { exit 0 }

# Início do turno: último prompt digitado por você, lido do fim do histórico.
function Get-InicioDoTurno([string]$Caminho) {
    if (-not $Caminho -or -not (Test-Path -LiteralPath $Caminho)) { return $null }
    $stream = [IO.File]::Open($Caminho, 'Open', 'Read', 'ReadWrite')
    try {
        $tamanho = [Math]::Min($stream.Length, 1MB)
        $null = $stream.Seek(-$tamanho, 'End')
        $buffer = New-Object byte[] $tamanho
        $null = $stream.Read($buffer, 0, $tamanho)
    } finally {
        $stream.Dispose()
    }
    $linhas = [Text.Encoding]::UTF8.GetString($buffer) -split "`n"
    for ($i = $linhas.Count - 1; $i -ge 0; $i--) {
        if ($linhas[$i] -notlike '*"type":"user"*') { continue }
        try { $entrada = $linhas[$i] | ConvertFrom-Json } catch { continue }
        if ($entrada.isMeta) { continue }
        $conteudo = $entrada.message.content
        $ehPrompt = if ($conteudo -is [string]) {
            -not $conteudo.StartsWith('<')
        } else {
            -not @($conteudo | Where-Object { $_.type -eq 'tool_result' }).Count -and
            @($conteudo | Where-Object { $_.type -eq 'text' -and -not $_.text.StartsWith('[Request interrupted') }).Count
        }
        if ($ehPrompt) { return [DateTimeOffset]::Parse($entrada.timestamp) }
    }
    return $null
}

function Format-Duracao([TimeSpan]$Tempo) {
    if ($Tempo.TotalHours -ge 1) { return '{0}h{1:00}m' -f [Math]::Floor($Tempo.TotalHours), $Tempo.Minutes }
    if ($Tempo.TotalMinutes -ge 1) { return '{0}m{1:00}s' -f $Tempo.Minutes, $Tempo.Seconds }
    return '{0}s' -f $Tempo.Seconds
}

$inicio = Get-InicioDoTurno $evento.transcript_path
$duracao = if ($inicio) { [DateTimeOffset]::UtcNow - $inicio } else { $null }
if ($duracao -and $duracao.TotalSeconds -lt $SegundosMinimos) { exit 0 }

# Resumo: primeira linha com texto da resposta final, sem marcações de Markdown.
$resumo = $evento.last_assistant_message -split "`r?`n" |
    ForEach-Object { ($_ -replace '[#*`>_|]', '' -replace '^\s*[-•]\s*', '').Trim() } |
    Where-Object { $_ } |
    Select-Object -First 1
if ($resumo.Length -gt 140) { $resumo = $resumo.Substring(0, 139) + '…' }

$projeto = if ($evento.cwd) { Split-Path -Leaf $evento.cwd } else { 'Claude Code' }
$rodape = if ($duracao) { "Claude Code · levou $(Format-Duracao $duracao)" } else { 'Claude Code' }

# Notificação do Windows em nome do Windows Terminal (clicar nela abre o terminal).
try {
    $null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]
    $escape = { param($texto) [Security.SecurityElement]::Escape($texto) }
    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
    $xml.LoadXml(@"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>✓ Tarefa concluída · $(& $escape $projeto)</text>
      <text>$(& $escape $resumo)</text>
      <text placement="attribution">$(& $escape $rodape)</text>
    </binding>
  </visual>
  <audio silent="true"/>
</toast>
"@)
    $notificacao = New-Object Windows.UI.Notifications.ToastNotification $xml
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Microsoft.WindowsTerminal_8wekyb3d8bbwe!App').Show($notificacao)
} catch {}

# Som próprio (arpejo de sino), tocado até o fim antes de o processo sair.
$som = Join-Path $PSScriptRoot 'sons\tarefa-concluida.wav'
if (Test-Path -LiteralPath $som) {
    (New-Object System.Media.SoundPlayer $som).PlaySync()
}
