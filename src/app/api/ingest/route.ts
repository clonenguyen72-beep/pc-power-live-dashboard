import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const apiKey = (process.env.INGEST_API_KEY || "").trim();
    const given = (req.headers.get("x-api-key") || "").trim();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Thiếu biến môi trường INGEST_API_KEY trên server" },
        { status: 500 }
      );
    }

    if (given !== apiKey) {
      return NextResponse.json({ ok: false, error: "Không được phép (sai API key)" }, { status: 401 });
    }

    const body = await req.json();
    const now = new Date().toISOString();

    const payload = {
      time: now,
      uptime_hours: Number(body.uptimeHours ?? 0),
      cpu_percent: Number(body.cpuPercent ?? 0),
      realtime_estimated_w: Number(body.realtimeEstimatedW ?? 0),
      avg_w_from_boot: Number(body.avgWFromBoot ?? 0),
      estimated_kwh_from_boot: Number(body.estimatedKwhFromBoot ?? 0),
      estimated_cost_from_boot_vnd: Number(body.estimatedCostFromBootVND ?? 0),
      rate_per_kwh_vnd: Number(body.ratePerKwhVND ?? 0),
      host: String(body.host ?? "NamPcServer"),
      cpu_name: String(body.cpuName ?? ""),
      gpu_name: String(body.gpuName ?? ""),
      ram_total_gb: Number(body.ramTotalGB ?? 0),
      ram_used_gb: Number(body.ramUsedGB ?? 0),
      disk_total_gb: Number(body.diskTotalGB ?? 0),
      disk_free_gb: Number(body.diskFreeGB ?? 0),
      os_name: String(body.osName ?? ""),
    };

    const supabase = getSupabase();
    const { error } = await supabase.from("pc_power_metrics").insert(payload);

    if (error) {
      return NextResponse.json(
        { ok: false, error: `Lưu dữ liệu thất bại: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, savedAt: now });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const friendly =
      msg.includes("SUPABASE_URL") || msg.includes("SUPABASE_SERVICE_ROLE_KEY")
        ? "Thiếu cấu hình Supabase (SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY)."
        : msg;
    return NextResponse.json(
      { ok: false, error: friendly === "Unknown error" ? "Đã xảy ra lỗi không xác định" : friendly },
      { status: 500 }
    );
  }
}
