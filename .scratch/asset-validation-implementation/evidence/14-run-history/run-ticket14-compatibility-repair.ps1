$ErrorActionPreference = 'Stop'
$env:PATH = 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64;' + $env:PATH
$env:MV_KEEP_WINDOWS_SANDBOXES = '1'
$taskOutput = 'M:/Shuen/Codex/asset-validation-notes'
$runRecords = @(Get-Content -LiteralPath "$taskOutput/ticket14-serial-final-runs.json" -Raw | ConvertFrom-Json)
function Invoke-Ticket14RepairVerification {
  param([string]$Label, [string]$Entry, [string[]]$Files, [string]$Pattern = '')
  $env:MV_CLI_ENTRY = $Entry
  $env:MV_WINDOWS_TEST_OUTPUT = Join-Path ([System.IO.Path]::GetTempPath()) "rpgmaker-event-dsl-ticket14-$Label"
  $arguments_ = @('--filter', 'rpgmaker-event-dsl', 'exec', 'vitest', 'run') + $Files + @('--maxWorkers=1', '--reporter=default', '--reporter=json', "--outputFile=$taskOutput/ticket14-$Label.json")
  if ($Pattern) { $arguments_ += @('-t', $Pattern) }
  $startedAt = [DateTime]::UtcNow.ToString('o')
  & pnpm @arguments_ *> "$taskOutput/ticket14-$Label.log"
  $resultCode = $LASTEXITCODE
  $script:runRecords += [ordered]@{label=$Label; entry=$Entry; files=$Files; pattern=$Pattern; workspaceOutput=$env:MV_WINDOWS_TEST_OUTPUT; startedAt=$startedAt; completedAt=[DateTime]::UtcNow.ToString('o'); exitCode=$resultCode}
  $script:runRecords | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath "$taskOutput/ticket14-serial-final-runs.json" -Encoding utf8
  Get-Content -LiteralPath "$taskOutput/ticket14-$Label.log" -Tail 12
  if ($resultCode -ne 0) { exit $resultCode }
}
Invoke-Ticket14RepairVerification -Label 'source-capability-repair' -Entry 'source' -Files @('test/asset-file-workspace.test.ts') -Pattern 'AV.F03.(exact-plus-case-variant|multiple-case-variants)'
$compatibilityFiles = @('test/compile-inputs.test.ts','test/compile-publication.test.ts','test/snapshot-binding.test.ts','test/workspace-locking.test.ts','test/decompile-publication.test.ts','test/push-drift.test.ts','test/push-recovery.test.ts','test/asset-file-workspace.test.ts','test/final-review-workspace.test.ts','test/workspace.test.ts','test/windows-baseline.test.ts','test/asset-diagnostics-workspace.test.ts','test/asset-workflow-workspace.test.ts')
Invoke-Ticket14RepairVerification -Label 'built-compatibility' -Entry 'built' -Files $compatibilityFiles
