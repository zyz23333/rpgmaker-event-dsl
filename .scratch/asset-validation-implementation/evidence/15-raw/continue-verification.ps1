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
  $script:records | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $history 'verification-commands-resume.json') -Encoding utf8NoBOM
  if ($code -ne 0) { throw "$Name failed with exit $code" }
}
$suites = @('test/push-drift.test.ts', 'test/push-recovery.test.ts', 'test/snapshot-binding.test.ts', 'test/workspace-locking.test.ts', 'test/compile-inputs.test.ts')
Invoke-Verification 'regression-built' (@('--filter', 'rpgmaker-event-dsl', 'test:windows-baseline', '--maxWorkers=1') + $suites + @('--reporter=json', '--outputFile=../../test-results/15-regression-built.json'))
Copy-Item -LiteralPath 'test-results/15-regression-built.json' -Destination (Join-Path $history 'regression-built-runner.json')
Invoke-Verification 'typecheck' @('typecheck')
Invoke-Verification 'lint' @('lint')
Invoke-Verification 'format-check' @('format:check')
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'Git diff whitespace validation failed.' }
