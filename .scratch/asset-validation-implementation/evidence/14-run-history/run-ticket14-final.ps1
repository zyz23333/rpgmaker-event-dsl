$ErrorActionPreference = 'Stop'
$env:PATH = 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64;' + $env:PATH
$env:MV_KEEP_WINDOWS_SANDBOXES = '1'
$taskOutput = 'M:/Shuen/Codex/asset-validation-notes'
$runRecords = @()
function Invoke-Ticket14Verification {
  param([string]$Label, [string]$Entry, [string[]]$Files, [string]$Pattern = '')
  $env:MV_CLI_ENTRY = $Entry
  $env:MV_WINDOWS_TEST_OUTPUT = "$taskOutput/ticket14-$Label-workspaces"
  $arguments_ = @('--filter', 'rpgmaker-event-dsl', 'exec', 'vitest', 'run') + $Files + @('--maxWorkers=1', '--reporter=default', '--reporter=json', "--outputFile=$taskOutput/ticket14-$Label.json")
  if ($Pattern) { $arguments_ += @('-t', $Pattern) }
  $startedAt = [DateTime]::UtcNow.ToString('o')
  & pnpm @arguments_ *> "$taskOutput/ticket14-$Label.log"
  $resultCode = $LASTEXITCODE
  $script:runRecords += [ordered]@{label=$Label; entry=$Entry; files=$Files; pattern=$Pattern; startedAt=$startedAt; completedAt=[DateTime]::UtcNow.ToString('o'); exitCode=$resultCode}
  $script:runRecords | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath "$taskOutput/ticket14-serial-final-runs.json" -Encoding utf8
  Get-Content -LiteralPath "$taskOutput/ticket14-$Label.log" -Tail 10
  if ($resultCode -ne 0) { exit $resultCode }
}
Invoke-Ticket14Verification -Label 'source-final-serial' -Entry 'source' -Files @('test/asset-push-workspace.test.ts')
Invoke-Ticket14Verification -Label 'built-final-serial' -Entry 'built' -Files @('test/asset-push-workspace.test.ts')
Invoke-Ticket14Verification -Label 'source-support-serial' -Entry 'source' -Files @('test/asset-workflow-workspace.test.ts') -Pattern 'AV.W12.next-command-fresh'
Invoke-Ticket14Verification -Label 'built-support-serial' -Entry 'built' -Files @('test/asset-workflow-workspace.test.ts') -Pattern 'AV.W12.next-command-fresh'
$compatibilityFiles = @('test/compile-inputs.test.ts','test/compile-publication.test.ts','test/snapshot-binding.test.ts','test/workspace-locking.test.ts','test/decompile-publication.test.ts','test/push-drift.test.ts','test/push-recovery.test.ts','test/asset-file-workspace.test.ts','test/final-review-workspace.test.ts','test/workspace.test.ts','test/windows-baseline.test.ts','test/asset-diagnostics-workspace.test.ts','test/asset-workflow-workspace.test.ts')
Invoke-Ticket14Verification -Label 'source-compatibility' -Entry 'source' -Files $compatibilityFiles
Invoke-Ticket14Verification -Label 'built-compatibility' -Entry 'built' -Files $compatibilityFiles
