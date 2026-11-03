param([int]$StartAt = 1, [string]$RunPrefix = '16-focused')
$ErrorActionPreference = 'Stop'
$env:PATH = 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64;' + $env:PATH
$taskCases = @(
  'AV.W15.all-generated-missing-asset.api.case.expected',
  'AV.W15.all-generated-missing-asset.cli.case.expected',
  'AV.W15.all-snapshot.api.case.expected',
  'AV.W15.mixed.api.case.expected',
  'AV.W15.missing.api.case.expected',
  'AV.W15.unknown.api.case.expected',
  'AV.W16.stale-original-basis.api.case.expected',
  'AV.W16.changed-current-config.api.case.expected',
  'AV.W18.concurrent-workspace.api.case.expected',
  'AV.W18.pending-non-push.api.case.expected',
  'AV.W18.pending-rebind.api.case.expected',
  'AV.W19.recovery.api.case.expected'
)
node .scratch/asset-validation-implementation/evidence/16-raw/verify-16-registration.mjs
if ($LASTEXITCODE -ne 0) { throw 'Static registration verification failed' }
$taskOrdinal = 0
foreach ($taskId in $taskCases) {
  $taskOrdinal++
  if ($taskOrdinal -lt $StartAt) { continue }
  $taskName = '{0}-{1:d2}-source' -f $RunPrefix, $taskOrdinal
  $taskHistory = '.scratch/asset-validation-implementation/evidence/16-raw/'
  & pnpm --filter rpgmaker-event-dsl exec vitest run test/asset-recovery-workspace.test.ts -t $taskId --maxWorkers=1 --reporter=json --outputFile=('../../' + $taskHistory + $taskName + '.json') *> ($taskHistory + $taskName + '.log')
  $taskExit = $LASTEXITCODE
  $taskReport = Get-Content -LiteralPath ($taskHistory + $taskName + '.json') -Raw | ConvertFrom-Json
  $taskPassed = @($taskReport.testResults.assertionResults | Where-Object { $_.status -eq 'passed' })
  if ($taskExit -ne 0 -or $taskReport.numPassedTests -ne 1 -or $taskReport.numFailedTests -ne 0 -or $taskReport.numTotalTests -ne 12 -or $taskPassed.Count -ne 1 -or $taskPassed[0].fullName.Split(':')[0] -ne $taskId) {
    throw ('Focused case did not actually pass once: ' + $taskId)
  }
  $taskReceiptPath = 'test-results/asset-validation/' + $taskId + '.source.json'
  $taskReceipt = Get-Content -LiteralPath $taskReceiptPath -Raw | ConvertFrom-Json
  if ($taskReceipt.status -ne 'passed' -or $taskReceipt.id -ne $taskId) { throw 'Receipt does not match actual passed case' }
  Copy-Item -LiteralPath $taskReceiptPath -Destination ($taskHistory + $taskName + '-receipt.json')
  Write-Output ($taskName + ': one actual pass; 11 filtered registrations are not passes; receipt matched ' + $taskId)
}
