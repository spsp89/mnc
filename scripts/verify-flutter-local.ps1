param(
  [string]$TempPath = "D:\BNC-local\flutter-temp",
  [string]$ConfigFile = "config.local.json",
  [switch]$SkipAnalyze
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

if (-not (Test-Path -LiteralPath $TempPath)) {
  New-Item -ItemType Directory -Path $TempPath | Out-Null
}

# Flutter compiler artifacts can exceed the free space available in the
# workstation's default C: temp folder. Scope the override to this process so
# other applications retain their normal Windows temporary directory.
$env:TEMP = (Resolve-Path -LiteralPath $TempPath).Path
$env:TMP = $env:TEMP

Push-Location $flutterProject
try {
  Write-Output "Flutter compiler temp: $env:TEMP"
  & flutter pub get
  if ($LASTEXITCODE -ne 0) {
    throw "flutter pub get failed with exit code $LASTEXITCODE."
  }

  if (-not $SkipAnalyze) {
    & flutter analyze
    if ($LASTEXITCODE -ne 0) {
      throw "flutter analyze failed with exit code $LASTEXITCODE."
    }
  }

  & flutter test --dart-define-from-file=$ConfigFile --reporter expanded
  if ($LASTEXITCODE -ne 0) {
    throw "flutter test failed with exit code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
