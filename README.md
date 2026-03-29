# PC Power Live Dashboard (Vercel + Upstash Redis)

Realtime dashboard to show:
- Uptime
- CPU load
- Estimated realtime watt
- Estimated kWh/cost from boot
- Recent history timeline

## 1) Required env vars on Vercel

Add these in Vercel Project Settings -> Environment Variables:

- `INGEST_API_KEY` = your secret key for local collector
- `UPSTASH_REDIS_REST_URL` (from Upstash Redis integration)
- `UPSTASH_REDIS_REST_TOKEN` (from Upstash Redis integration)

> If your project exposes KV vars (`KV_REST_API_URL/TOKEN`) this app also supports them.

## 2) Deploy

```bash
npm install
npm run build
vercel --prod
```

## 3) Run local collector on your PC

Use PowerShell script:

```powershell
powershell -ExecutionPolicy Bypass -File .\collector_power_to_vercel.ps1 `
  -IngestUrl "https://YOUR-APP.vercel.app/api/ingest" `
  -ApiKey "YOUR_INGEST_API_KEY" `
  -RatePerKwh 3000 `
  -AvgWFromBoot 160 `
  -IdleW 120 `
  -MaxW 240 `
  -IntervalSec 10
```

## 4) Notes

- Vercel app cannot read your physical PC directly.
- Data is pushed from your PC collector -> Vercel API -> Upstash Redis.
- For more accuracy, replace estimated watt with smart plug/watt meter readings.
