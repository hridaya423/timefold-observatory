$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\android-env.ps1"
$project = Resolve-Path "$PSScriptRoot\..\..\android"
Push-Location $project
try {
    & '.\gradlew.bat' ':app:assembleDebug' '-PreactNativeArchitectures=arm64-v8a' '--console=plain'
    if ($LASTEXITCODE -ne 0) { throw 'Android diagnostic compilation failed. Inspect the Gradle error above.' }
} finally { Pop-Location }
