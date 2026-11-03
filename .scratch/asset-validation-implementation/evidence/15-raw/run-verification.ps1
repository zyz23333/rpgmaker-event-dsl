$ErrorActionPreference = 'Stop'
$env:PATH = 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64;' + $env:PATH
$history = Join-Path (Get-Location) '.scratch/asset-validation-implementation/evidence/15-raw'
$records = @()
function Invoke-Verification {
  param([string]$Name, [string[]]$Arguments)
  $started = (Get-Date).ToUniversalTime().ToString('o')
  & pnpm @Arguments *>&1 | Tee-Object -FilePath (Join-Path $history ($Name + '.log'))
  $code = $LASTEXITCODE
  $script:records += [pscustomobject]@{ name = $Name; command = 'pnpm'; arguments = $Arguments; startedAt = $started; completedAt = (Get-Date).ToUniversalTime().ToString('o'); exitCode = $code }
  $script:records | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $history 'verification-commands.json') -Encoding utf8NoBOM
  if ($code -ne 0) { throw "$Name failed with exit $code" }
}
$source = Get-Content -LiteralPath 'test-results/15-final-source.json' -Raw | ConvertFrom-Json
if (!$source.success -or $source.numTotalTests -ne 45 -or $source.numPassedTests -ne 45 -or $source.numPendingTests -ne 0) { throw 'Frozen source suite must first pass all 45 tests without filtering.' }
Copy-Item -LiteralPath 'test-results/15-final-source.json' -Destination (Join-Path $history 'final-source-runner.json')
$plan = Get-Content -LiteralPath 'M:/Shuen/Codex/asset-validation-notes/final-canonical-id-plan.json' -Raw | ConvertFrom-Json
$ids = @($plan.perTicket.'15'.primaryIds) + @($plan.perTicket.'15'.supportingIds) + @('AV.C13.push-success.formal.case.expected')
foreach ($id in $ids) { Copy-Item -LiteralPath "test-results/asset-validation/$id.source.json" -Destination (Join-Path $history "$id.source.json") }
Invoke-Verification 'build' @('build')
Get-ChildItem -LiteralPath 'packages/rpgmaker-event-dsl/dist' -File -Recurse | ForEach-Object { [pscustomobject]@{ path = $_.FullName; bytes = $_.Length; sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() } } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $history 'built-artifacts.json') -Encoding utf8NoBOM
Invoke-Verification 'final-built' @('--filter', 'rpgmaker-event-dsl', 'test:windows-baseline', '--maxWorkers=1', 'test/asset-push-workspace.test.ts', '--reporter=json', '--outputFile=../../test-results/15-final-built.json')
Copy-Item -LiteralPath 'test-results/15-final-built.json' -Destination (Join-Path $history 'final-built-runner.json')
foreach ($id in $ids) { Copy-Item -LiteralPath "test-results/asset-validation/$id.built.json" -Destination (Join-Path $history "$id.built.json") }
$suites = @('test/push-drift.test.ts', 'test/push-recovery.test.ts', 'test/snapshot-binding.test.ts', 'test/workspace-locking.test.ts', 'test/compile-inputs.test.ts')
Invoke-Verification 'regression-source' (@('--filter', 'rpgmaker-event-dsl', 'test', '--maxWorkers=1') + $suites + @('--reporter=json', '--outputFile=../../test-results/15-regression-source.json'))
Copy-Item -LiteralPath 'test-results/15-regression-source.json' -Destination (Join-Path $history 'regression-source-runner.json')
Invoke-Verification 'regression-built' (@('--filter', 'rpgmaker-event-dsl', 'test:windows-baseline', '--maxWorkers=1') + $suites + @('--reporter=json', '--outputFile=../../test-results/15-regression-built.json'))
Copy-Item -LiteralPath 'test-results/15-regression-built.json' -Destination (Join-Path $history 'regression-built-runner.json')
Invoke-Verification 'typecheck' @('typecheck')
Invoke-Verification 'lint' @('lint')
Invoke-Verification 'format-check' @('format:check')
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'Git diff whitespace validation failed.' }
