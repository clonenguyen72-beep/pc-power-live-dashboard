import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

const LATEST_KEY = "pc_power:latest";
const HISTORY_KEY = "pc_power:history";

export async function GET() {
  try {
    const redis = getRedis();
    const latest = await redis.get(LATEST_KEY);
    const rawHistory = (await redis.lrange(HISTORY_KEY, 0, 99)) as string[];

    const history = (rawHistory || [])
      .map((x) => {
        try {
          return typeof x === "string" ? JSON.parse(x) : x;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, latest, history });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
