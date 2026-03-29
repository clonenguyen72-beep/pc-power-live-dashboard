import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function mapRow(r: any) {
  return {
    time: r.time,
    uptimeHours: Number(r.uptime_hours ?? 0),
    cpuPercent: Number(r.cpu_percent ?? 0),
    realtimeEstimatedW: Number(r.realtime_estimated_w ?? 0),
    avgWFromBoot: Number(r.avg_w_from_boot ?? 0),
    estimatedKwhFromBoot: Number(r.estimated_kwh_from_boot ?? 0),
    estimatedCostFromBootVND: Number(r.estimated_cost_from_boot_vnd ?? 0),
    ratePerKwhVND: Number(r.rate_per_kwh_vnd ?? 0),
    host: String(r.host ?? ""),
  };
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("pc_power_metrics")
      .select("time,uptime_hours,cpu_percent,realtime_estimated_w,avg_w_from_boot,estimated_kwh_from_boot,estimated_cost_from_boot_vnd,rate_per_kwh_vnd,host")
      .order("time", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const rows = (data || []).map(mapRow);
    const latest = rows[0] ?? null;

    return NextResponse.json({ ok: true, latest, history: rows });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
