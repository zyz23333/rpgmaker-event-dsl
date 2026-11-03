Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class AssetDeviceNameProbe {
  [DllImport("ntdll.dll", CharSet = CharSet.Unicode)]
  public static extern uint RtlIsDosDeviceName_U(string path);
}
'@
$taskNames = @(
  'NUL.png', 'NUL .png', 'NUL  .png', 'NUL...png', 'NUL. .png',
  'NULx.png', 'COM1 .ogg', 'LPT¹ .webm', 'COM0 .png', 'NUL .png.png',
  'cOn   .png', ' NUL.png', 'NUL x.png', 'NUL .foo.png',
  ('NUL' + [char]0x00a0 + '.png'), ('NUL' + [char]0x3000 + '.png')
)
$taskResults = foreach ($taskName in $taskNames) {
  $taskValue = [AssetDeviceNameProbe]::RtlIsDosDeviceName_U($taskName)
  [PSCustomObject]@{
    name = $taskName
    codePoints = @($taskName.ToCharArray() | ForEach-Object { '{0:X4}' -f [int]$_ })
    isDosDevice = ($taskValue -ne 0)
    nativeResult = ('{0:X8}' -f $taskValue)
  }
}
$taskRecord = [PSCustomObject]@{
  observedAtUtc = [DateTime]::UtcNow.ToString('o')
  os = [Environment]::OSVersion.VersionString
  powershell = $PSVersionTable.PSVersion.ToString()
  api = 'ntdll.dll!RtlIsDosDeviceName_U (read-only name classification)'
  repositoryIntegration = '29f19dfd3ed943df2e0c9ae2b7c446ada248d501'
  purpose = 'Independent Windows device-name classification; not an MV runtime rerun or product acceptance test.'
  results = $taskResults
}
$taskJson = $taskRecord | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText('M:/Shuen/Codex/asset-validation-notes/device-name-space-probe.json', $taskJson + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
$taskJson
