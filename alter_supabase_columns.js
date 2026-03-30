/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');

const sql = `
alter table public.pc_power_metrics add column if not exists cpu_name text;
alter table public.pc_power_metrics add column if not exists gpu_name text;
alter table public.pc_power_metrics add column if not exists ram_total_gb double precision;
alter table public.pc_power_metrics add column if not exists ram_used_gb double precision;
alter table public.pc_power_metrics add column if not exists disk_total_gb double precision;
alter table public.pc_power_metrics add column if not exists disk_free_gb double precision;
alter table public.pc_power_metrics add column if not exists os_name text;
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
