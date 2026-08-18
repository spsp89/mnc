param(
  [string]$BasePath = "D:\BNC-local"
)

$ErrorActionPreference = "Stop"

$postgresRoot = Join-Path $BasePath "pgsql-postgis-18"
$postgresData = Join-Path $BasePath "postgres-data"
$postgresLog = Join-Path $BasePath "postgres.log"
$pgCtl = Join-Path $postgresRoot "bin\pg_ctl.exe"
$pgIsReady = Join-Path $postgresRoot "bin\pg_isready.exe"

$redisRoot = Join-Path $BasePath "redis-8.10.0\Redis-8.10.0-Windows-x64-msys2"
$redisData = Join-Path $BasePath "redis-data"
$redisServer = Join-Path $redisRoot "redis-server.exe"
$redisCli = Join-Path $redisRoot "redis-cli.exe"

foreach ($requiredPath in @($pgCtl, $pgIsReady, $postgresData, $redisServer, $redisCli)) {
  if (-not (Test-Path -LiteralPath $requiredPath)) {
    throw "Required local dependency path is missing: $requiredPath"
  }
}

if (-not (Test-Path -LiteralPath $redisData)) {
  New-Item -ItemType Directory -Path $redisData | Out-Null
}

function Test-PostgresReady {
  & $pgIsReady -h 127.0.0.1 -p 55433 -d bnc -U bnc *> $null
  return $LASTEXITCODE -eq 0
}

function Test-RedisReady {
  $reply = & $redisCli -h 127.0.0.1 -p 6379 ping 2>$null
  return $LASTEXITCODE -eq 0 -and $reply -eq "PONG"
}

if (Test-PostgresReady) {
  Write-Output "PostgreSQL is already ready on 127.0.0.1:55433."
} else {
  Write-Output "Starting the isolated BNC PostgreSQL cluster..."
  & $pgCtl start -D $postgresData -l $postgresLog -o '"-p 55433 -h 127.0.0.1"' | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL failed to start. Inspect $postgresLog"
  }
}

if (Test-RedisReady) {
  Write-Output "Redis is already ready on 127.0.0.1:6379."
} else {
  Write-Output "Starting the isolated BNC Redis runtime..."
  $redisArguments = @(
    "--bind", "127.0.0.1",
    "--port", "6379",
    "--dir", $redisData,
    "--appendonly", "yes"
  )
  Start-Process -FilePath $redisServer -ArgumentList $redisArguments -WorkingDirectory $redisRoot -WindowStyle Hidden | Out-Null
}

$deadline = (Get-Date).AddSeconds(15)
do {
  $postgresReady = Test-PostgresReady
  $redisReady = Test-RedisReady
  if ($postgresReady -and $redisReady) {
    break
  }
  Start-Sleep -Milliseconds 250
} while ((Get-Date) -lt $deadline)

if (-not $postgresReady) {
  throw "PostgreSQL did not become ready on 127.0.0.1:55433. Inspect $postgresLog"
}

if (-not $redisReady) {
  throw "Redis did not become ready on 127.0.0.1:6379."
}

Write-Output "Local dependencies are ready."
Write-Output "PostgreSQL: 127.0.0.1:55433 / database bnc"
Write-Output "Redis:      127.0.0.1:6379"
