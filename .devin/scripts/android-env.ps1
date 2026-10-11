$ErrorActionPreference = 'Stop'
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { 'D:\Android\Sdk' }
$jbr = 'C:\Program Files\Android\Android Studio\jbr'
if (-not (Test-Path "$jbr\bin\java.exe")) { throw 'Android Studio JBR was not found.' }
if (-not (Test-Path $sdk)) { throw 'Android SDK was not found. Set ANDROID_HOME for this process.' }
$env:JAVA_HOME = $jbr
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:PATH = "$jbr\bin;$sdk\platform-tools;$sdk\cmdline-tools\15859902\bin;$env:PATH"
