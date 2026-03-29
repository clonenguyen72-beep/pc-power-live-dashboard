import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const LATEST_KEY = "pc_power:latest";
const HISTORY_KEY = "pc_power:history";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.INGEST_API_KEY;
    const given = req.headers.get("x-api-key") || "";

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
      uptimeHours: Number(body.uptimeHours ?? 0),
      cpuPercent: Number(body.cpuPercent ?? 0),
      realtimeEstimatedW: Number(body.realtimeEstimatedW ?? 0),
      avgWFromBoot: Number(body.avgWFromBoot ?? 0),
      estimatedKwhFromBoot: Number(body.estimatedKwhFromBoot ?? 0),
      estimatedCostFromBootVND: Number(body.estimatedCostFromBootVND ?? 0),
      ratePerKwhVND: Number(body.ratePerKwhVND ?? 0),
      host: String(body.host ?? "NamPcServer"),
    };

    const redis = getRedis();
    await redis.set(LATEST_KEY, payload);
    await redis.lpush(HISTORY_KEY, JSON.stringify(payload));
    await redis.ltrim(HISTORY_KEY, 0, 299);

    return NextResponse.json({ ok: true, savedAt: now });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
