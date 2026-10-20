param([Parameter(Mandatory=$true)][string]$Label)
$env:PATH='C:/Users/Shuen/AppData/Local/pnpm-cache/dlx/e71f3854d6e4a210b542a0fff0f6de7931eae2c732fef8abdbb6314c36843fd7/1a152fc0f14-2f10/node_modules/.pnpm/node@22.23.0/node_modules/node/bin;'+$env:PATH
$env:TEMP='M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp'
$env:TMP=$env:TEMP
$env:NODE_COMPILE_CACHE="$env:TEMP/node-compile-cache"
node "$env:TEMP/freeze-inputs-v2.cjs" $Label *> "$env:TEMP/$Label-freeze.log"
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
$staticResults=@()
$staticChecks=@(
  @{name='typecheck';arguments=@('--filter','rpgmaker-event-dsl','typecheck')},
  @{name='scoped-lint';arguments=@('exec','oxlint','packages/rpgmaker-event-dsl/src','packages/rpgmaker-event-dsl/test','packages/rpgmaker-event-dsl/vitest.windows.config.ts')},
  @{name='scoped-format';arguments=@('exec','oxfmt','--ignore-path','.oxfmtignore','--check','packages/rpgmaker-event-dsl')}
)
foreach($staticCheck in $staticChecks){
  $staticStarted=(Get-Date).ToUniversalTime().ToString('o')
  $staticArguments=$staticCheck.arguments
  pnpm @staticArguments *> "$env:TEMP/$Label-$($staticCheck.name).log"
  $staticExit=$LASTEXITCODE
  $staticResults+=@{check=$staticCheck.name;arguments=$staticArguments;startedAt=$staticStarted;completedAt=(Get-Date).ToUniversalTime().ToString('o');exitCode=$staticExit}
}
git diff --check *> "$env:TEMP/$Label-whitespace.log"
$staticResults+=@{check='git diff --check';exitCode=$LASTEXITCODE}
$staticResults|ConvertTo-Json -Depth 10|Set-Content "$env:TEMP/$Label-results.json"
if(@($staticResults|Where-Object {$_.exitCode -ne 0}).Count -ne 0){exit 1}
exit 0
