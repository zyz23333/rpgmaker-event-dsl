param([string]$Label, [string[]]$Tests = @('test/map-characters.test.ts'))
$env:PATH = 'C:/Users/Shuen/AppData/Local/pnpm-cache/dlx/e71f3854d6e4a210b542a0fff0f6de7931eae2c732fef8abdbb6314c36843fd7/1a152fc0f14-2f10/node_modules/.pnpm/node@22.23.0/node_modules/node/bin;' + $env:PATH
$env:TEMP = 'M:/Shuen/Codex/mv-events-implementation-20261020/ticket35-temp'
$env:TMP = $env:TEMP
$env:MV_WINDOWS_TEST_OUTPUT = "$env:TEMP/sandboxes"
$env:MV_EVIDENCE_OUTPUT = "$env:TEMP/results"
$env:MV_KEEP_WINDOWS_SANDBOXES = '1'
pnpm --filter rpgmaker-event-dsl exec vitest run @Tests 2>&1 | Tee-Object -FilePath "$env:TEMP/$Label.log"
exit $LASTEXITCODE
