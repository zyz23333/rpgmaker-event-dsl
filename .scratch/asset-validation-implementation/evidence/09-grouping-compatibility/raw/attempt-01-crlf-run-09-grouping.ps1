param([ValidateSet('diagnostic', 'source', 'built')][string]$Phase)
$ErrorActionPreference = 'Stop'
$env:PATH = 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64;' + $env:PATH
$env:MV_KEEP_WINDOWS_SANDBOXES = '1'
$taskHistory = '.scratch/asset-validation-implementation/evidence/09-grouping-compatibility/raw/'
$taskId = 'AV.C07.shared-system-field.formal.case.expected'
if ($Phase -eq 'diagnostic') {
  Remove-Item Env:MV_CLI_ENTRY -ErrorAction SilentlyContinue
  $taskOutput = Join-Path (Get-Location) ($taskHistory + 'diagnostic-original-contract39.json')
  & pnpm --filter rpgmaker-event-dsl exec tsx ('../../' + $taskHistory + 'capture-original.ts') $taskOutput *> ($taskHistory + 'diagnostic-original-contract39.log')
  if ($LASTEXITCODE -ne 0) { throw 'Original-input diagnostic did not complete' }
  $taskDiagnostic = Get-Content -Raw -LiteralPath $taskOutput | ConvertFrom-Json
  if (-not $taskDiagnostic.completed -or @($taskDiagnostic.operations).Count -ne 3) { throw 'Diagnostic is incomplete' }
  Write-Output 'Diagnostic only: original API Check/Compile and actual CLI Check captured; zero canonical passes claimed.'
  exit
}
if ($Phase -eq 'built') { $env:MV_CLI_ENTRY = 'built' } else { Remove-Item Env:MV_CLI_ENTRY -ErrorAction SilentlyContinue }
$taskArguments = @('--filter', 'rpgmaker-event-dsl', 'exec', 'vitest', 'run')
if ($Phase -eq 'built') { $taskArguments += @('--config', 'vitest.windows.config.ts') }
$taskName = 'focused-' + $Phase
$taskArguments += @('test/asset-system-workspace.test.ts', '-t', $taskId, '--maxWorkers=1', '--reporter=json', ('--outputFile=../../' + $taskHistory + $taskName + '.json'))
& pnpm @taskArguments *> ($taskHistory + $taskName + '.log')
$taskExit = $LASTEXITCODE
$taskReport = Get-Content -LiteralPath ($taskHistory + $taskName + '.json') -Raw | ConvertFrom-Json
$taskPassed = @($taskReport.testResults.assertionResults | Where-Object { $_.status -eq 'passed' })
if ($taskExit -ne 0 -or $taskReport.numPassedTests -ne 1 -or $taskReport.numFailedTests -ne 0 -or $taskReport.numTotalTests -ne 105 -or $taskPassed.Count -ne 1 -or $taskPassed[0].fullName.Split(':')[0] -ne $taskId) { throw 'Canonical callback did not actually pass exactly once' }
$taskReceiptPath = 'test-results/asset-validation/' + $taskId + '.' + $Phase + '.json'
$taskReceipt = Get-Content -LiteralPath $taskReceiptPath -Raw | ConvertFrom-Json
if ($taskReceipt.status -ne 'passed' -or $taskReceipt.id -ne $taskId -or $taskReceipt.ownerTicket -ne '09') { throw 'Canonical receipt mismatch' }
Copy-Item -LiteralPath $taskReceiptPath -Destination ($taskHistory + $taskName + '-receipt.json')
Write-Output ($taskName + ': exactly one actual pass; 104 filtered registrations are not passes; canonical receipt matched.')
