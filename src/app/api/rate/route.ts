import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const DEFAULT_RATE_VND_PER_KWH = 3000;

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("pc_power_settings")
      .select("rate_per_kwh_vnd")
      .eq("id", 1)
      .limit(1)
      .maybeSingle();

    // If table doesn't exist yet, keep dashboard working by falling back.
    if (error) {
      return NextResponse.json(
        { ok: true, ratePerKwhVND: DEFAULT_RATE_VND_PER_KWH, warning: "pc_power_settings missing or unreadable" },
        { status: 200 }
      );
    }

    const rate = Number(data?.rate_per_kwh_vnd ?? DEFAULT_RATE_VND_PER_KWH);
    return NextResponse.json({ ok: true, ratePerKwhVND: rate });
  } catch {
    return NextResponse.json({ ok: true, ratePerKwhVND: DEFAULT_RATE_VND_PER_KWH }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rate = Number(body.ratePerKwhVND ?? 0);

    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ ok: false, error: "ratePerKwhVND không hợp lệ" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from("pc_power_settings")
      .upsert(
        { id: 1, rate_per_kwh_vnd: Math.round(rate), updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: `Không cập nhật rate: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ratePerKwhVND: Math.round(rate) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

