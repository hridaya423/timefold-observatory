param([switch]$AcceptLicenses)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$sdk = 'D:\Android\Sdk'
$tools = "$sdk\cmdline-tools\15859902"
$archive = "$sdk\commandlinetools-win-15859902.zip"
$checksum = '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a'
if (-not (Test-Path "$tools\bin\sdkmanager.bat")) {
    if (Test-Path $tools) { throw 'A partial command-line tools directory exists. Inspect it before continuing.' }
    Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip' -OutFile $archive
    if ((Get-FileHash -Algorithm SHA256 $archive).Hash.ToLowerInvariant() -ne $checksum) { throw 'SDK tools checksum did not match.' }
    Expand-Archive -Path $archive -DestinationPath "$sdk\cmdline-tools\unpacked-15859902"
    Move-Item "$sdk\cmdline-tools\unpacked-15859902\cmdline-tools" $tools
}
. "$PSScriptRoot\android-env.ps1"
& "$tools\bin\sdkmanager.bat" --sdk_root=$sdk --version
if ($LASTEXITCODE -ne 0) { throw 'sdkmanager could not run with the project JBR. Check its Java requirement.' }
if ($AcceptLicenses) {
    (1..20 | ForEach-Object { 'y' }) | & "$tools\bin\sdkmanager.bat" --sdk_root=$sdk --licenses
    if ($LASTEXITCODE -ne 0) { throw 'SDK license acceptance failed.' }
}
& "$tools\bin\sdkmanager.bat" --sdk_root=$sdk 'platform-tools' 'platforms;android-36' 'build-tools;36.0.0'
if ($LASTEXITCODE -ne 0) { throw 'Android SDK package installation failed.' }
& "$sdk\platform-tools\adb.exe" version
& "$sdk\platform-tools\adb.exe" devices -l
