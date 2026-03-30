-- Settings table for electricity price (rate per kWh)
-- Used by:
-- - GET/POST /api/rate (Next.js API)
-- - Windows collector to read the latest rate

create table if not exists public.pc_power_settings (
  id integer primary key,
  rate_per_kwh_vnd bigint not null,
  updated_at timestamptz not null default now()
);

insert into public.pc_power_settings (id, rate_per_kwh_vnd)
values (1, 3000)
on conflict (id) do nothing;

