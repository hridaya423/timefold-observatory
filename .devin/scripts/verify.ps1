$ErrorActionPreference = 'Stop'
& npm.cmd --prefix (Resolve-Path "$PSScriptRoot\..\..") run verify
exit $LASTEXITCODE
