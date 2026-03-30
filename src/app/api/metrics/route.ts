import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

type SupabaseRow = Record<string, unknown>;

function num(row: SupabaseRow, key: string) {
  return Number(row[key] ?? 0);
}

function str(row: SupabaseRow, key: string) {
  return String(row[key] ?? "");
}

function mapRow(row: SupabaseRow) {
  return {
    time: str(row, "time"),
    uptimeHours: num(row, "uptime_hours"),
    cpuPercent: num(row, "cpu_percent"),
    realtimeEstimatedW: num(row, "realtime_estimated_w"),
    avgWFromBoot: num(row, "avg_w_from_boot"),
    estimatedKwhFromBoot: num(row, "estimated_kwh_from_boot"),
    estimatedCostFromBootVND: num(row, "estimated_cost_from_boot_vnd"),
    ratePerKwhVND: num(row, "rate_per_kwh_vnd"),
    host: str(row, "host"),
    cpuName: str(row, "cpu_name"),
    gpuName: str(row, "gpu_name"),
    ramTotalGB: num(row, "ram_total_gb"),
    ramUsedGB: num(row, "ram_used_gb"),
    diskTotalGB: num(row, "disk_total_gb"),
    diskFreeGB: num(row, "disk_free_gb"),
    osName: str(row, "os_name"),
  };
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("pc_power_metrics")
      .select("time,uptime_hours,cpu_percent,realtime_estimated_w,avg_w_from_boot,estimated_kwh_from_boot,estimated_cost_from_boot_vnd,rate_per_kwh_vnd,host,cpu_name,gpu_name,ram_total_gb,ram_used_gb,disk_total_gb,disk_free_gb,os_name")
      .order("time", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { ok: false, error: `Không tải được dữ liệu: ${error.message}` },
        { status: 500 }
      );
    }

    const rows = (data || []).map(mapRow);
    const latest = rows[0] ?? null;

    return NextResponse.json({ ok: true, latest, history: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const friendly =
      msg.includes("SUPABASE_URL") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")
        ? "Thiếu cấu hình Supabase (SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY)."
        : "Đã xảy ra lỗi khi truy vấn dữ liệu Supabase.";
    return NextResponse.json(
      { ok: false, error: friendly },
      { status: 500 }
    );
  }
}
