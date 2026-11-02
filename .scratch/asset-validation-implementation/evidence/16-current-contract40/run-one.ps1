param([ValidateSet('compatibility-red','source','built')][string]$Phase)
$ErrorActionPreference = 'Stop'
$env:PATH = 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64;' + $env:PATH
$history = '.scratch/asset-validation-implementation/evidence/16-current-contract40'
$id = 'AV.W16.changed-current-config.api.case.expected'
$entry = if ($Phase -eq 'built') { 'built' } else { 'source' }
$taskArgs = @('--filter','rpgmaker-event-dsl')
if ($entry -eq 'built') { $taskArgs += 'test:windows-baseline' } else { $taskArgs += 'test' }
$taskArgs += @('--maxWorkers=1','test/asset-recovery-workspace.test.ts','-t','^AV[.]W16[.]changed-current-config[.]api[.]case[.]expected:','--reporter=json',('--outputFile=../../' + $history + '/' + $Phase + '-runner.json'))
$started = (Get-Date).ToUniversalTime().ToString('o')
& pnpm @taskArgs *> ($history + '/' + $Phase + '.log')
$code = $LASTEXITCODE
$commandRecord = [pscustomobject]@{
  phase=$Phase; command='pnpm'; arguments=$taskArgs; startedAt=$started
  completedAt=(Get-Date).ToUniversalTime().ToString('o'); exitCode=$code
  head=(& git rev-parse HEAD); node=(& node --version); TEMP=$env:TEMP; TMP=$env:TMP
}
$commandRecord | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath ($history + '/' + $Phase + '-command.json') -Encoding utf8NoBOM
$report = Get-Content -LiteralPath ($history + '/' + $Phase + '-runner.json') -Raw | ConvertFrom-Json
$executed = @($report.testResults.assertionResults | Where-Object { $_.status -in @('passed','failed') })
if ($report.numTotalTests -ne 12 -or $report.numPendingTests -ne 11 -or $executed.Count -ne 1 -or $executed[0].fullName.Split(':')[0] -ne $id) { throw 'Expected exactly this callback and eleven filtered registrations' }
$receiptPath = 'test-results/asset-validation/' + $id + '.' + $entry + '.json'
Copy-Item -LiteralPath $receiptPath -Destination ($history + '/' + $Phase + '-receipt.' + $entry + '.json')
$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
if ($Phase -eq 'compatibility-red') {
  if ($code -eq 0 -or $report.numFailedTests -ne 1 -or $report.numPassedTests -ne 0 -or $receipt.status -ne 'failed' -or $receipt.actual -notmatch 'mv-1[.]6[.]1/40' -or $receipt.actual -notmatch 'mv-1[.]6[.]1/39') { throw 'Expected current39 literal versus actual40 compatibility failure' }
} else {
  if ($code -ne 0 -or $report.numFailedTests -ne 0 -or $report.numPassedTests -ne 1 -or $receipt.status -ne 'passed') { throw 'Expected one actual pass with a matching receipt' }
}
Write-Output ($Phase + ': ' + $report.numPassedTests + ' passed, ' + $report.numFailedTests + ' failed, 11 filtered; exit ' + $code)
