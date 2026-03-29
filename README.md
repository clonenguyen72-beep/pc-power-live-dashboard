# PC Power Live Dashboard (Vercel + Supabase)

Realtime dashboard to show:
- Uptime
- CPU load
- Estimated realtime watt
- Estimated kWh/cost from boot
- Recent history timeline

## 1) Create table on Supabase

Open Supabase SQL Editor and run `supabase_init.sql`.

## 2) Required env vars on Vercel

- `INGEST_API_KEY` = secret key for local collector
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

(Optional, public client)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3) Deploy

```bash
npm install
npm run build
vercel --prod
```

## 4) Run local collector on your PC

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

## 5) Notes

- Vercel app cannot read your physical PC directly.
- Data is pushed from your PC collector -> Vercel API -> Supabase.
- For more accuracy, replace estimated watt with smart plug/watt meter readings.
