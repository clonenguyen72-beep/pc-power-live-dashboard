import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const apiKey = (process.env.INGEST_API_KEY || "").trim();
    const given = (req.headers.get("x-api-key") || "").trim();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "INGEST_API_KEY is missing on server" },
        { status: 500 }
      );
    }

    if (given !== apiKey) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
    };

    const supabase: any = getSupabase();
    const { error } = await supabase.from("pc_power_metrics").insert(payload);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, savedAt: now });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
