$ErrorActionPreference = 'Stop'
$env:PATH = 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64;' + $env:PATH
$history = Join-Path (Get-Location) '.scratch/asset-validation-implementation/evidence/03-device-space'
$records = @()
function Invoke-Verification {
  param([string]$Name, [string[]]$Arguments)
  $started = (Get-Date).ToUniversalTime().ToString('o')
  & pnpm @Arguments *>&1 | Tee-Object -FilePath (Join-Path $history ($Name + '.log'))
  $code = $LASTEXITCODE
  $script:records += [pscustomobject]@{ name=$Name; command='pnpm'; arguments=$Arguments; startedAt=$started; completedAt=(Get-Date).ToUniversalTime().ToString('o'); exitCode=$code }
  $script:records | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $history 'verification-commands.json') -Encoding utf8NoBOM
  if ($code -ne 0) { throw "$Name failed with exit $code" }
}
function Save-Receipts {
  param([string]$ReportName, [string]$Entry, [string]$Destination)
  $destinationPath = Join-Path $history $Destination
  New-Item -ItemType Directory -Force $destinationPath | Out-Null
  $report = Get-Content -LiteralPath (Join-Path $history $ReportName) -Raw | ConvertFrom-Json
  foreach ($case in $report.testResults.assertionResults | Where-Object status -eq 'passed') {
    $id = $case.fullName.Split(':')[0]
    Copy-Item -LiteralPath "test-results/asset-validation/$id.$Entry.json" -Destination $destinationPath
  }
}
Invoke-Verification 'final-source' @('--filter','rpgmaker-event-dsl','test','--maxWorkers=1','test/asset-file-workspace.test.ts','--reporter=json','--outputFile=../../test-results/03-device-space-final-source.json')
Copy-Item -LiteralPath 'test-results/03-device-space-final-source.json' -Destination (Join-Path $history 'final-source-runner.json')
Save-Receipts 'final-source-runner.json' 'source' 'final-source-receipts'
Invoke-Verification 'build' @('build')
Get-ChildItem -LiteralPath 'packages/rpgmaker-event-dsl/dist' -File -Recurse | ForEach-Object { [pscustomobject]@{ path=$_.FullName; bytes=$_.Length; sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() } } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $history 'built-artifacts.json') -Encoding utf8NoBOM
Invoke-Verification 'final-built' @('--filter','rpgmaker-event-dsl','test:windows-baseline','--maxWorkers=1','test/asset-file-workspace.test.ts','--reporter=json','--outputFile=../../test-results/03-device-space-final-built.json')
Copy-Item -LiteralPath 'test-results/03-device-space-final-built.json' -Destination (Join-Path $history 'final-built-runner.json')
Save-Receipts 'final-built-runner.json' 'built' 'final-built-receipts'
Invoke-Verification 'media-source' @('--filter','rpgmaker-event-dsl','test','--maxWorkers=1','test/asset-media-workspace.test.ts','-t','^AV.F06.','--reporter=json','--outputFile=../../test-results/03-device-space-media-source.json')
Copy-Item -LiteralPath 'test-results/03-device-space-media-source.json' -Destination (Join-Path $history 'media-source-runner.json')
Save-Receipts 'media-source-runner.json' 'source' 'media-source-receipts'
Invoke-Verification 'media-built' @('--filter','rpgmaker-event-dsl','test:windows-baseline','--maxWorkers=1','test/asset-media-workspace.test.ts','-t','^AV.F06.','--reporter=json','--outputFile=../../test-results/03-device-space-media-built.json')
Copy-Item -LiteralPath 'test-results/03-device-space-media-built.json' -Destination (Join-Path $history 'media-built-runner.json')
Save-Receipts 'media-built-runner.json' 'built' 'media-built-receipts'
Invoke-Verification 'typecheck' @('typecheck')
Invoke-Verification 'lint' @('lint')
Invoke-Verification 'format-check' @('format:check')
git diff --check
if ($LASTEXITCODE -ne 0) { throw 'Git whitespace validation failed.' }
