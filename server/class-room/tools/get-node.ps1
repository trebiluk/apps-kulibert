# Fetches the official Node 22 LTS for Windows x64 (with npm) into %LOCALAPPDATA%\Bertopia\node-v22.x.y-win-x64 and
# checks the download's SHA-256 against nodejs.org's SHASUMS256.txt before unpacking. "Start Bertopia Home.cmd" runs
# this only when no Node is found on the PC. Nothing is installed system-wide; delete the folder to remove it.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$base = Join-Path $env:LOCALAPPDATA 'Bertopia'
New-Item -ItemType Directory -Force -Path $base | Out-Null
$list = Invoke-RestMethod -UseBasicParsing -Uri 'https://nodejs.org/dist/index.json'
$rel = $list | Where-Object { $_.lts -and $_.version -like 'v22.*' -and ($_.files -contains 'win-x64-zip') } | Select-Object -First 1
if (-not $rel) { throw 'No Node 22 LTS for Windows x64 listed on nodejs.org' }
$v = $rel.version
$name = "node-$v-win-x64"
if (Test-Path (Join-Path (Join-Path $base $name) 'node.exe')) { Write-Host "Node $v is already here."; exit 0 }
$zip = Join-Path $base "$name.zip"
Write-Host "Downloading $name.zip from nodejs.org ..."
Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/$v/$name.zip" -OutFile $zip
$sums = [string](Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/dist/$v/SHASUMS256.txt").Content
$line = ($sums -split "`n") | Where-Object { $_.Trim().EndsWith("  $name.zip") } | Select-Object -First 1
if (-not $line) { Remove-Item $zip -Force; throw "No checksum listed for $name.zip" }
$want = ($line.Trim() -split '\s+')[0].ToLower()
$have = (Get-FileHash -Algorithm SHA256 -Path $zip).Hash.ToLower()
if ($want -ne $have) { Remove-Item $zip -Force; throw "Checksum mismatch for $name.zip: not unpacked" }
Write-Host "Checksum OK. Unpacking ..."
Expand-Archive -Path $zip -DestinationPath $base -Force
Remove-Item $zip -Force
Write-Host "Node $v is ready in $base\$name"
