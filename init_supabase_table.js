const { Client } = require('pg');

const sql = `
create table if not exists public.pc_power_metrics (
  id bigserial primary key,
  time timestamptz not null default now(),
  uptime_hours double precision not null,
  cpu_percent double precision not null,
  realtime_estimated_w double precision not null,
  avg_w_from_boot double precision not null,
  estimated_kwh_from_boot double precision not null,
  estimated_cost_from_boot_vnd bigint not null,
  rate_per_kwh_vnd bigint not null,
  host text not null
);
create index if not exists idx_pc_power_metrics_time_desc on public.pc_power_metrics (time desc);
`;

(async () => {
  const conn = process.env.POSTGRES_URL;
  if (!conn) throw new Error('POSTGRES_URL missing');

  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('OK');
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
