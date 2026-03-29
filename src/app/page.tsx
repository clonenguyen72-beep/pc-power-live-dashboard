"use client";

import { useEffect, useMemo, useState } from "react";

type Metric = {
  time: string;
  uptimeHours: number;
  cpuPercent: number;
  realtimeEstimatedW: number;
  avgWFromBoot: number;
  estimatedKwhFromBoot: number;
  estimatedCostFromBootVND: number;
  ratePerKwhVND: number;
  host: string;
};

export default function Home() {
  const [latest, setLatest] = useState<Metric | null>(null);
  const [history, setHistory] = useState<Metric[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const load = async () => {
      try {
        const res = await fetch("/api/metrics", { cache: "no-store" });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Failed");
        setLatest(data.latest || null);
        setHistory((data.history || []) as Metric[]);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Khong tai duoc du lieu");
      } finally {
        timer = setTimeout(load, 5000);
      }
    };

    load();
    return () => clearTimeout(timer);
  }, []);

  const dailyEstimate = useMemo(() => {
    if (!latest) return null;
    const kwh = (latest.realtimeEstimatedW / 1000) * 24;
    const vnd = kwh * latest.ratePerKwhVND;
    return { kwh, vnd };
  }, [latest]);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "Inter, Arial, sans-serif" }}>
      <h1>PC Power Live Dashboard</h1>
      <p>Theo doi thong so dien nang thoi gian thuc tu may tinh cua ban.</p>

      {error && <p style={{ color: "crimson" }}>Loi: {error}</p>}

      {!latest ? (
        <p>Dang cho du lieu... (hay chay collector tren may local)</p>
      ) : (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, margin: "16px 0" }}>
            <Card title="Host" value={latest.host} />
            <Card title="Cap nhat luc" value={new Date(latest.time).toLocaleString()} />
            <Card title="Uptime" value={`${latest.uptimeHours.toFixed(2)} h`} />
            <Card title="CPU" value={`${latest.cpuPercent.toFixed(2)} %`} />
            <Card title="Cong suat realtime" value={`${latest.realtimeEstimatedW.toFixed(2)} W`} />
            <Card title="kWh tu luc boot" value={`${latest.estimatedKwhFromBoot.toFixed(3)} kWh`} />
            <Card title="Tien dien tu luc boot" value={`${latest.estimatedCostFromBootVND.toLocaleString("vi-VN")} VND`} />
            <Card title="Gia dien" value={`${latest.ratePerKwhVND.toLocaleString("vi-VN")} VND/kWh`} />
          </section>

          {dailyEstimate && (
            <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <h3>Uoc tinh neu giu muc tai hien tai trong 24h</h3>
              <p>{dailyEstimate.kwh.toFixed(3)} kWh/ngay ~ {dailyEstimate.vnd.toLocaleString("vi-VN")} VND/ngay</p>
            </section>
          )}

          <section>
            <h3>Lich su gan day</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>CPU %</Th>
                    <Th>W</Th>
                    <Th>Uptime (h)</Th>
                    <Th>kWh boot</Th>
                    <Th>Cost boot (VND)</Th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((x, i) => (
                    <tr key={i}>
                      <Td>{new Date(x.time).toLocaleTimeString()}</Td>
                      <Td>{x.cpuPercent?.toFixed?.(2)}</Td>
                      <Td>{x.realtimeEstimatedW?.toFixed?.(2)}</Td>
                      <Td>{x.uptimeHours?.toFixed?.(2)}</Td>
                      <Td>{x.estimatedKwhFromBoot?.toFixed?.(3)}</Td>
                      <Td>{Number(x.estimatedCostFromBootVND || 0).toLocaleString("vi-VN")}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, background: "#fff" }}>
      <div style={{ fontSize: 13, color: "#64748b" }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ border: "1px solid #ddd", padding: 8, background: "#f8fafc", textAlign: "left" }}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ border: "1px solid #ddd", padding: 8 }}>{children}</td>;
}
