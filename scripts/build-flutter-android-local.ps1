param(
  [string]$TempPath = "D:\BNC-local\flutter-temp",
  [string]$GradleCachePath = "D:\BNC-local\gradle-cache",
  [string]$ConfigFile = "config.local.json"
)

$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$flutterProject = Join-Path $repositoryRoot "flutter app"
$configuration = Join-Path $flutterProject $ConfigFile

if (-not (Test-Path -LiteralPath $flutterProject)) {
  throw "Flutter project is missing: $flutterProject"
}

if (-not (Test-Path -LiteralPath $configuration)) {
  throw "Flutter configuration is missing: $configuration"
}

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  throw "Flutter is not available on PATH."
}

foreach ($path in @($TempPath, $GradleCachePath)) {
  if (-not (Test-Path -LiteralPath $path)) {
    New-Item -ItemType Directory -Path $path | Out-Null
  }
}

# Keep large compiler and Gradle artifacts away from the space-constrained C:
# drive. These overrides are process-scoped and do not change Windows settings.
$env:TEMP = (Resolve-Path -LiteralPath $TempPath).Path
$env:TMP = $env:TEMP
$env:GRADLE_USER_HOME = (Resolve-Path -LiteralPath $GradleCachePath).Path

Push-Location $flutterProject
try {
  Write-Output "Flutter compiler temp: $env:TEMP"
  Write-Output "Gradle cache: $env:GRADLE_USER_HOME"

  & flutter pub get
  if ($LASTEXITCODE -ne 0) {
    throw "flutter pub get failed with exit code $LASTEXITCODE."
  }

  & flutter build apk --debug "--dart-define-from-file=$ConfigFile"
  if ($LASTEXITCODE -ne 0) {
    throw "Flutter Android debug build failed with exit code $LASTEXITCODE."
  }

  $apk = Join-Path $flutterProject "build\app\outputs\flutter-apk\app-debug.apk"
  if (-not (Test-Path -LiteralPath $apk)) {
    throw "Flutter reported success but the APK was not found: $apk"
  }

  $artifact = Get-Item -LiteralPath $apk
  $checksum = Get-FileHash -LiteralPath $apk -Algorithm SHA256
  Write-Output "APK: $($artifact.FullName)"
  Write-Output "Size: $($artifact.Length) bytes"
  Write-Output "SHA256: $($checksum.Hash)"
} finally {
  Pop-Location
}
