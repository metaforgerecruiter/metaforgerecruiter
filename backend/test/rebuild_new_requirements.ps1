# Keep only new, real client-mail requirements and make them accurate with the fixed pipeline.
#
#   1. Soft-delete every requirement that is not client mail since the cutoff (backup + restorable)
#   2. Pause the scheduler (mailbox lease) and make the pipeline forget the window's emails
#   3. Re-process the 2-day mail window with the fixed pipeline (updates in place, latest email wins)
#   4. List mail requirements no email produced again (prune runs as a dry run; you confirm with --apply)
#
# Run from the backend folder:   powershell -ExecutionPolicy Bypass -File test\rebuild_new_requirements.ps1
# Every step writes a backup to ..\backups; each removal can be undone with --restore <backup>.

$ErrorActionPreference = 'Stop'
$backend = Split-Path -Parent $PSScriptRoot
$pipeline = Join-Path (Split-Path -Parent $backend) 'Mail extraction\devloper\devloper'
$python = Join-Path $pipeline '.venv\Scripts\python.exe'
$cutoff = '2026-10-12T18:30:00Z'   # 13 Oct 2026 00:00 IST
Set-Location $backend

Write-Host "`n== 1. Soft-delete everything except client mail since $cutoff" -ForegroundColor Cyan
node test/keep_only_new_requirements.js --since $cutoff --apply
if ($LASTEXITCODE -ne 0) { throw 'step 1 failed' }

Write-Host "`n== 2. Pause the scheduler and reset pipeline state for the window" -ForegroundColor Cyan
node test/mail_lease.js hold 45
if ($LASTEXITCODE -ne 0) { throw 'could not pause the scheduler (an extraction is running); rerun in a minute' }
$runStart = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
try {
    & $python -I (Join-Path $pipeline 'scripts\reset_messages_state.py') --since '2026-10-12T18:30:00' --received-since $cutoff
    if ($LASTEXITCODE -ne 0) { throw 'step 2 failed' }

    Write-Host "`n== 3. Re-process the mail window with the fixed pipeline" -ForegroundColor Cyan
    $key = (Get-Content .env | Where-Object { $_ -match '^INTERNAL_AUTOMATION_API_KEY=' }) -replace '^INTERNAL_AUTOMATION_API_KEY=', '' -replace '"', ''
    $port = (Get-Content .env | Where-Object { $_ -match '^PORT=' }) -replace '^PORT=', ''
    if (-not $port) { $port = '3001' }
    $env:METAFORGE_MODE = 'api'
    $env:METAFORGE_API_URL = "http://127.0.0.1:$port"
    $env:METAFORGE_REQUIREMENTS_ENDPOINT = 'api/v1/requirements/ingest-email'
    $env:METAFORGE_API_KEY = $key.Trim()
    $env:PYTHONIOENCODING = 'utf-8'
    Push-Location $pipeline
    try {
        & $python -W ignore scripts\sync_to_backend.py --mode historical --days 2 --timezone Asia/Kolkata --limit 300 2>&1 |
            Select-String -Pattern 'SYNC_RESULT_JSON|MetaForge API error|needs review|Traceback'
    } finally { Pop-Location }
} finally {
    node test/mail_lease.js release
}

Write-Host "`n== 4. Requirements no email produced again (dry run)" -ForegroundColor Cyan
node test/prune_unconfirmed_requirements.js --run-start $runStart
Write-Host "`nReview the list above. To remove them and align client names, run:" -ForegroundColor Yellow
Write-Host "  node test/prune_unconfirmed_requirements.js --run-start $runStart --apply" -ForegroundColor Yellow
