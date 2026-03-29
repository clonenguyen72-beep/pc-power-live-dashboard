param(
    [Parameter(Mandatory = $true)] [string]$IngestUrl,
    [Parameter(Mandatory = $true)] [string]$ApiKey,
    [double]$RatePerKwh = 3000,
    [double]$AvgWFromBoot = 160,
    [double]$IdleW = 120,
    [double]$MaxW = 240,
    [int]$IntervalSec = 10
)

function Get-UptimeHours {
    $os = Get-CimInstance Win32_OperatingSystem
    $boot = $os.LastBootUpTime
    $uptime = (Get-Date) - $boot
    return [math]::Round($uptime.TotalHours, 4)
}

function Get-CpuPercent {
    try {
        $sample = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples[0].CookedValue
        if ($sample -lt 0) { $sample = 0 }
        if ($sample -gt 100) { $sample = 100 }
        return [math]::Round($sample, 2)
    } catch {
        return 0
    }
}

function Get-EstimatedRealtimeW([double]$cpu, [double]$idle, [double]$max) {
    $w = $idle + (($max - $idle) * ($cpu / 100.0))
    return [math]::Round($w, 2)
}

function Calc-Kwh([double]$watt, [double]$hours) {
    return [math]::Round(($watt / 1000.0) * $hours, 6)
}

function Calc-Cost([double]$kwh, [double]$rate) {
    return [math]::Round($kwh * $rate, 0)
}

Write-Host "Collector started -> $IngestUrl" -ForegroundColor Cyan

while ($true) {
    $uptimeH = Get-UptimeHours
    $cpu = Get-CpuPercent
    $realtimeW = Get-EstimatedRealtimeW -cpu $cpu -idle $IdleW -max $MaxW

    $kwhFromBoot = Calc-Kwh -watt $AvgWFromBoot -hours $uptimeH
    $costFromBoot = Calc-Cost -kwh $kwhFromBoot -rate $RatePerKwh

    $payload = @{
        uptimeHours = $uptimeH
        cpuPercent = $cpu
        realtimeEstimatedW = $realtimeW
        avgWFromBoot = $AvgWFromBoot
        estimatedKwhFromBoot = $kwhFromBoot
        estimatedCostFromBootVND = $costFromBoot
        ratePerKwhVND = $RatePerKwh
        host = $env:COMPUTERNAME
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Method Post -Uri $IngestUrl -Headers @{ 'x-api-key' = $ApiKey } -ContentType 'application/json' -Body $payload | Out-Null
        Write-Host "[$(Get-Date -Format HH:mm:ss)] sent" -ForegroundColor Green
    }
    catch {
        Write-Host "[$(Get-Date -Format HH:mm:ss)] send failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds $IntervalSec
}
