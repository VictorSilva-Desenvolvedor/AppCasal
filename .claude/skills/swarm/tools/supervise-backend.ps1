# Sobe o backend apontando para o Mongo em memória e reinicia sozinho se cair,
# guardando stdout/stderr de cada execução (o backend local caiu sem stack
# várias vezes em 2026-10-14; isso ajuda a achar a causa).
# Uso: powershell -ExecutionPolicy Bypass -File .claude/skills/swarm/tools/supervise-backend.ps1
$env:MONGO_URI = 'mongodb://127.0.0.1:27999/swarm'   # NUNCA rode o backend sem isso: o .env aponta pro Atlas de produção
$backend = Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..\calendario-web\backend')
$logDir = Join-Path $PSScriptRoot '..\..\..\..\run\backend-logs'
New-Item -ItemType Directory -Force $logDir | Out-Null
$n = 0
while ($true) {
  $n++
  Add-Content "$logDir\supervisor.log" "$(Get-Date -Format o) START #$n"
  $p = Start-Process -FilePath node -ArgumentList '--trace-uncaught', 'src/server.js' -WorkingDirectory $backend `
    -RedirectStandardOutput "$logDir\out-$n.log" -RedirectStandardError "$logDir\err-$n.log" -WindowStyle Hidden -PassThru -Wait
  Add-Content "$logDir\supervisor.log" "$(Get-Date -Format o) EXIT code=$($p.ExitCode)"
  Start-Sleep 1
}
