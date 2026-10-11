$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$directory = Resolve-Path "$PSScriptRoot\..\tools\deno-2.5.6"
$archive = Join-Path $directory 'deno.zip'
if (-not (Test-Path (Join-Path $directory 'deno.exe'))) {
    Invoke-WebRequest 'https://github.com/denoland/deno/releases/download/v2.5.6/deno-x86_64-pc-windows-msvc.zip' -OutFile $archive
    $expected = '1327356cd63e23d0da7d11d5f5ca6b45902b1b62ee2debd4fbbd0aad2aab9786'
    if ((Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Deno archive checksum did not match the official release digest.' }
    Expand-Archive $archive -DestinationPath $directory
}
& (Join-Path $directory 'deno.exe') --version
if ($LASTEXITCODE -ne 0) { throw 'Deno could not run.' }
