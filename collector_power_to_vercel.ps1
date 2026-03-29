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

function Get-HardwareInfo {
    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1 Name
    $gpu = Get-CimInstance Win32_VideoController | Select-Object -First 1 Name
    $os = Get-CimInstance Win32_OperatingSystem
    $cs = Get-CimInstance Win32_ComputerSystem
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object -First 1 Size,FreeSpace

    $ramTotalGB = 0
    $ramUsedGB = 0
    if ($cs.TotalPhysicalMemory) {
        $ramTotalGB = [math]::Round(($cs.TotalPhysicalMemory / 1GB), 2)
    }
    if ($os.TotalVisibleMemorySize -and $os.FreePhysicalMemory) {
        $usedKB = [double]$os.TotalVisibleMemorySize - [double]$os.FreePhysicalMemory
        $ramUsedGB = [math]::Round(($usedKB / 1MB), 2)
    }

    $diskTotalGB = 0
    $diskFreeGB = 0
    if ($disk.Size) { $diskTotalGB = [math]::Round(($disk.Size / 1GB), 2) }
    if ($disk.FreeSpace) { $diskFreeGB = [math]::Round(($disk.FreeSpace / 1GB), 2) }

    return [pscustomobject]@{
        CpuName = $cpu.Name
        GpuName = $gpu.Name
        OsName = $os.Caption
        RamTotalGB = $ramTotalGB
        RamUsedGB = $ramUsedGB
        DiskTotalGB = $diskTotalGB
        DiskFreeGB = $diskFreeGB
    }
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

    $hw = Get-HardwareInfo

    $payload = @{
        uptimeHours = $uptimeH
        cpuPercent = $cpu
        realtimeEstimatedW = $realtimeW
        avgWFromBoot = $AvgWFromBoot
        estimatedKwhFromBoot = $kwhFromBoot
        estimatedCostFromBootVND = $costFromBoot
        ratePerKwhVND = $RatePerKwh
        host = $env:COMPUTERNAME
        cpuName = $hw.CpuName
        gpuName = $hw.GpuName
        osName = $hw.OsName
        ramTotalGB = $hw.RamTotalGB
        ramUsedGB = $hw.RamUsedGB
        diskTotalGB = $hw.DiskTotalGB
        diskFreeGB = $hw.DiskFreeGB
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
