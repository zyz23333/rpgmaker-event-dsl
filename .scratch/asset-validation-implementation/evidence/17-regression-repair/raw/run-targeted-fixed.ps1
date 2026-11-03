param([ValidateSet('source','built')][string]$Entry)
$ErrorActionPreference = 'Stop'
$env:PATH = 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64;' + $env:PATH
if ($env:MV_CLI_ENTRY) { throw 'No global entry override is allowed' }
$history = '.scratch/asset-validation-implementation/evidence/17-regression-repair/raw'
$pattern = '^(?:MV-S6-PICTURE-007:|MV-S3-INPUT-003:|MV-S6-AUDIO-002:|MV-S6-MOVEMENT-003:|MV-S6-SCREEN-002:|keeps an explicit old /23 contract stale until a normal current /40 Compile$)'
$taskArgs = @('--filter','rpgmaker-event-dsl','exec','vitest','run','--config',('../../' + $history + '/' + $Entry + '.config.ts'),'-t',$pattern,'--reporter=json',('--outputFile=../../' + $history + '/' + $Entry + '-runner.json'))
$started = (Get-Date).ToUniversalTime().ToString('o')
& pnpm @taskArgs *> ($history + '/' + $Entry + '.log')
$code = $LASTEXITCODE
$record = [pscustomobject]@{ entry=$Entry; command='pnpm'; arguments=$taskArgs; startedAt=$started; completedAt=(Get-Date).ToUniversalTime().ToString('o'); exitCode=$code; head=(& git rev-parse HEAD); node=(& node --version); TEMP=$env:TEMP; TMP=$env:TMP; workerOverride=$null; globalEntryOverride=$env:MV_CLI_ENTRY }
$record | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath ($history + '/' + $Entry + '-command.json') -Encoding utf8NoBOM
$report = Get-Content -LiteralPath ($history + '/' + $Entry + '-runner.json') -Raw | ConvertFrom-Json
$passed = @($report.testResults.assertionResults | Where-Object status -eq 'passed')
if ($code -ne 0 -or $report.numPassedTests -ne 22 -or $report.numFailedTests -ne 0 -or $passed.Count -ne 22 -or @($report.testResults).Count -ne 6) { throw 'Expected six real suites and twenty-two actual selected passes' }
& node ($history + '/capture-helpers.cjs') $Entry
if ($LASTEXITCODE -ne 0) { throw 'Helper capture failed' }
Write-Output ($Entry + ':22 actual passes; ' + $report.numPendingTests + ' filtered; six suites; UTC helpers archived')

