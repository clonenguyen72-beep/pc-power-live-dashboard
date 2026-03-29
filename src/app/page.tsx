"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

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
  cpuName?: string;
  gpuName?: string;
  ramTotalGB?: number;
  ramUsedGB?: number;
  diskTotalGB?: number;
  diskFreeGB?: number;
  osName?: string;
};

export default function Home() {
  const [latest, setLatest] = useState<Metric | null>(null);
  const [history, setHistory] = useState<Metric[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const load = async () => {
      try {
        const res = await fetch("/api/metrics", { cache: "no-store" });
        const data = await res.json();
        if (!data?.ok) throw new Error(data?.error || "Khong tai duoc du lieu");
        setLatest(data.latest || null);
        setHistory(data.history || []);
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

  const daily = useMemo(() => {
    if (!latest) return null;
    const kwh = (latest.realtimeEstimatedW / 1000) * 24;
    const vnd = kwh * latest.ratePerKwhVND;
    return { kwh, vnd };
  }, [latest]);

  const chart = history.slice(0, 20).reverse();

  return (
    <main className={styles.wrapper}>
      <section className={styles.hero}>
        <div>
          <h1>Dashboard Kiem soat may tinh</h1>
          <p>Theo doi thong so that tu may local theo thoi gian thuc</p>
          <div className={styles.meta}>Host: <b>{latest?.host || "Dang cho du lieu"}</b></div>
          <div className={styles.meta}>Cap nhat: <b>{latest ? new Date(latest.time).toLocaleString() : "--"}</b></div>
        </div>
        <span className={styles.live}>LIVE</span>
      </section>

      {error && <div className={styles.error}>Loi: {error}</div>}

      <section className={styles.gridStats}>
        <Card title="Uptime" value={latest ? `${latest.uptimeHours.toFixed(2)} h` : "--"} />
        <Card title="CPU" value={latest ? `${latest.cpuPercent.toFixed(2)} %` : "--"} />
        <Card title="Cong suat realtime" value={latest ? `${latest.realtimeEstimatedW.toFixed(2)} W` : "--"} />
        <Card title="kWh tu luc boot" value={latest ? `${latest.estimatedKwhFromBoot.toFixed(3)} kWh` : "--"} />
        <Card title="Tien dien tu luc boot" value={latest ? `${latest.estimatedCostFromBootVND.toLocaleString("vi-VN")} VND` : "--"} />
        <Card title="Gia dien" value={latest ? `${latest.ratePerKwhVND.toLocaleString("vi-VN")} VND/kWh` : "--"} />
      </section>

      <section className={styles.grid2}>
        <article className={styles.panel}>
          <h3>Thong so phan cung (that)</h3>
          <ul className={styles.list}>
            <li><b>CPU:</b> {latest?.cpuName || "--"}</li>
            <li><b>GPU:</b> {latest?.gpuName || "--"}</li>
            <li><b>RAM:</b> {latest?.ramUsedGB != null && latest?.ramTotalGB != null ? `${latest.ramUsedGB.toFixed(2)} / ${latest.ramTotalGB.toFixed(2)} GB` : "--"}</li>
            <li><b>Disk C:</b> {latest?.diskFreeGB != null && latest?.diskTotalGB != null ? `${latest.diskFreeGB.toFixed(2)} / ${latest.diskTotalGB.toFixed(2)} GB free` : "--"}</li>
            <li><b>OS:</b> {latest?.osName || "--"}</li>
          </ul>
        </article>

        <article className={styles.panel}>
          <h3>Uoc tinh 24h theo tai hien tai</h3>
          {daily ? (
            <div className={styles.dailyBox}>
              <div><b>{daily.kwh.toFixed(3)} kWh/ngay</b></div>
              <div><b>{daily.vnd.toLocaleString("vi-VN")} VND/ngay</b></div>
            </div>
          ) : (
            <p>Dang cho du lieu...</p>
          )}
        </article>
      </section>

      <section className={styles.panel}>
        <h3>Lich su 20 mau gan nhat (khong dummy)</h3>
        <div className={styles.chartWrap}>
          <svg viewBox="0 0 800 220" className={styles.svg}>
            <line x1="30" y1="190" x2="780" y2="190" className={styles.axis} />
            <line x1="30" y1="20" x2="30" y2="190" className={styles.axis} />
            {chart.length > 1 && (
              <polyline
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                points={chart
                  .map((d, i) => {
                    const x = 30 + (i / (chart.length - 1)) * 750;
                    const y = 190 - Math.min(170, (d.realtimeEstimatedW / 300) * 170);
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            )}
          </svg>
        </div>
      </section>

      <section className={styles.panel}>
        <h3>Bang du lieu gan day</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>CPU %</th>
                <th>W</th>
                <th>Uptime (h)</th>
                <th>kWh boot</th>
                <th>Cost boot</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 20).map((x, i) => (
                <tr key={i}>
                  <td>{new Date(x.time).toLocaleTimeString()}</td>
                  <td>{x.cpuPercent.toFixed(2)}</td>
                  <td>{x.realtimeEstimatedW.toFixed(2)}</td>
                  <td>{x.uptimeHours.toFixed(2)}</td>
                  <td>{x.estimatedKwhFromBoot.toFixed(3)}</td>
                  <td>{x.estimatedCostFromBootVND.toLocaleString("vi-VN")} VND</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardValue}>{value}</div>
    </div>
  );
}
