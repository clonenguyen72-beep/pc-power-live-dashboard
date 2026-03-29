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

  const cpu = latest?.cpuPercent ?? 0;
  const watt = latest?.realtimeEstimatedW ?? 0;

  return (
    <main className={styles.wrapper}>
      <section className={styles.headerCard}>
        <div>
          <h1 className={styles.title}>Computer Control Dashboard</h1>
          <p className={styles.subtitle}>Theo doi dien nang may tinh theo thoi gian thuc</p>
          <p className={styles.meta}>Host: <b>{latest?.host || "Dang cho du lieu"}</b></p>
          <p className={styles.meta}>Last update: <b>{latest ? new Date(latest.time).toLocaleString() : "--"}</b></p>
        </div>
        <div className={styles.badgeLive}>LIVE</div>
      </section>

      {error && <div className={styles.error}>Loi ket noi: {error}</div>}

      {!latest ? (
        <section className={styles.panel}>Dang cho du lieu tu local collector...</section>
      ) : (
        <>
          <section className={styles.statsGrid}>
            <MetricCard label="Uptime" value={`${latest.uptimeHours.toFixed(2)} h`} />
            <MetricCard label="CPU Load" value={`${latest.cpuPercent.toFixed(2)} %`} />
            <MetricCard label="Realtime Power" value={`${latest.realtimeEstimatedW.toFixed(2)} W`} />
            <MetricCard label="kWh since boot" value={`${latest.estimatedKwhFromBoot.toFixed(3)} kWh`} />
            <MetricCard label="Cost since boot" value={`${latest.estimatedCostFromBootVND.toLocaleString("vi-VN")} VND`} />
            <MetricCard label="Rate" value={`${latest.ratePerKwhVND.toLocaleString("vi-VN")} VND/kWh`} />
          </section>

          <section className={styles.dualGrid}>
            <div className={styles.panel}>
              <h3>System Load</h3>
              <Progress label="CPU" value={cpu} max={100} suffix="%" />
              <Progress label="Power" value={watt} max={300} suffix="W" />
              {dailyEstimate && (
                <div className={styles.estimateBox}>
                  <p>Uoc tinh 24h neu giu tai hien tai</p>
                  <b>{dailyEstimate.kwh.toFixed(3)} kWh / ngay</b>
                  <b>{dailyEstimate.vnd.toLocaleString("vi-VN")} VND / ngay</b>
                </div>
              )}
            </div>

            <div className={styles.panel}>
              <h3>Quick Summary</h3>
              <ul className={styles.summaryList}>
                <li>May dang hoat dong on dinh.</li>
                <li>Collector cap nhat du lieu moi 5 giay.</li>
                <li>So lieu la uoc tinh theo cong suat trung binh cau hinh.</li>
                <li>De chinh xac hon, dung o cam do dien thuc te.</li>
              </ul>
            </div>
          </section>

          <section className={styles.panel}>
            <h3>History (20 ban ghi moi nhat)</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>CPU %</th>
                    <th>W</th>
                    <th>Uptime (h)</th>
                    <th>kWh boot</th>
                    <th>Cost boot (VND)</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((x, i) => (
                    <tr key={i}>
                      <td>{new Date(x.time).toLocaleTimeString()}</td>
                      <td>{x.cpuPercent?.toFixed?.(2)}</td>
                      <td>{x.realtimeEstimatedW?.toFixed?.(2)}</td>
                      <td>{x.uptimeHours?.toFixed?.(2)}</td>
                      <td>{x.estimatedKwhFromBoot?.toFixed?.(3)}</td>
                      <td>{Number(x.estimatedCostFromBootVND || 0).toLocaleString("vi-VN")}</td>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
    </article>
  );
}

function Progress({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={styles.progressRow}>
      <div className={styles.progressHead}>
        <span>{label}</span>
        <b>{value.toFixed(2)} {suffix}</b>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
