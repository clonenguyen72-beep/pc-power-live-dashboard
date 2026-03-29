// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Cpu,
  Zap,
  Clock,
  HardDrive,
  Monitor,
  DollarSign,
  TrendingUp,
  Settings,
  Menu,
  Server,
  Receipt,
  CalendarDays,
  ArrowUp,
  ArrowDown,
  Lightbulb,
} from "lucide-react";

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

interface ChartPoint {
  time: string;
  power: number;
}

function SvgAreaChart({ data }: { data: ChartPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 288 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ChartPoint } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width, height });
    });
    ro.observe(el);
    setDims({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  if (!data.length) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
        Chua co du lieu
      </div>
    );
  }

  const padL = 48,
    padR = 16,
    padT = 16,
    padB = 36;
  const W = Math.max(1, dims.width - padL - padR);
  const H = Math.max(1, dims.height - padT - padB);

  const minVal = 0;
  const maxRaw = Math.max(...data.map((d) => d.power), 10);
  const maxVal = Math.ceil(maxRaw / 50) * 50 + 50;

  const xOf = (i: number) => padL + (i / Math.max(1, data.length - 1)) * W;
  const yOf = (v: number) => padT + H - ((v - minVal) / Math.max(1, maxVal - minVal)) * H;

  const pathD = data.reduce((acc, pt, i) => {
    const x = xOf(i);
    const y = yOf(pt.power);
    if (i === 0) return `M ${x},${y}`;
    const px = xOf(i - 1);
    const py = yOf(data[i - 1].power);
    const cx = (px + x) / 2;
    return `${acc} C ${cx},${py} ${cx},${y} ${x},${y}`;
  }, "");

  const areaD = `${pathD} L ${xOf(data.length - 1)},${padT + H} L ${xOf(0)},${padT + H} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    val: Math.round(minVal + f * (maxVal - minVal)),
    y: padT + H - f * H,
  }));

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left - padL;
      const ratio = mx / Math.max(1, W);
      const idx = Math.round(ratio * (data.length - 1));
      const clamped = Math.max(0, Math.min(data.length - 1, idx));
      const pt = data[clamped];
      setTooltip({ x: xOf(clamped), y: yOf(pt.power), point: pt });
    },
    [W, data]
  );

  return (
    <div ref={containerRef} className="w-full h-full relative select-none">
      <svg width={dims.width} height={dims.height} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((t) => (
          <line
            key={`grid-${t.val}`}
            x1={padL}
            y1={t.y}
            x2={padL + W}
            y2={t.y}
            stroke="#334155"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        {yTicks.map((t) => (
          <text key={`ylabel-${t.val}`} x={padL - 8} y={t.y + 4} textAnchor="end" fontSize={11} fill="#94a3b8">
            {t.val}
          </text>
        ))}

        {data.map((d, i) => (
          <text key={`xlabel-${i}`} x={xOf(i)} y={padT + H + 20} textAnchor="middle" fontSize={11} fill="#94a3b8">
            {d.time}
          </text>
        ))}

        <path d={areaD} fill="url(#areaGrad)" />
        <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {tooltip && (
          <>
            <line
              x1={tooltip.x}
              y1={padT}
              x2={tooltip.x}
              y2={padT + H}
              stroke="#8b5cf6"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.6}
            />
            <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="#8b5cf6" stroke="#1e293b" strokeWidth={2} />
          </>
        )}
      </svg>

      {tooltip && (() => {
        const boxW = 120;
        const rawLeft = tooltip.x + 12;
        const left = rawLeft + boxW > dims.width ? tooltip.x - boxW - 12 : rawLeft;
        return (
          <div
            className="absolute pointer-events-none bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg"
            style={{ left, top: tooltip.y - 36 }}
          >
            <div className="text-slate-400">{tooltip.point.time}</div>
            <div className="text-purple-400 font-semibold">{tooltip.point.power.toFixed(1)} W</div>
          </div>
        );
      })()}
    </div>
  );
}

const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${colorClass}`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
        <Icon className={`w-6 h-6 ${colorClass.replace("bg-", "text-")}`} />
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  </div>
);

const ProgressBar = ({ label, value, max, unit, color }) => {
  const safeMax = Math.max(1, max);
  const percentage = Math.max(0, Math.min(100, (value / safeMax) * 100));
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-400">
          {value}
          {unit} / {max}
          {unit}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

function ElectricityBillPanel({ latest, history }: { latest: Metric | null; history: Metric[] }) {
  const rate = Number(latest?.ratePerKwhVND ?? 3000);
  const fmtVnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} VND`;

  const realtimeW = Number(latest?.realtimeEstimatedW ?? 0);
  const bootKwh = Number(latest?.estimatedKwhFromBoot ?? 0);
  const bootCost = Number(latest?.estimatedCostFromBootVND ?? 0);

  const estimatedDayKwh = (realtimeW / 1000) * 24;
  const estimatedDayCost = estimatedDayKwh * rate;

  const prev = history[1];
  const prevCost = Number(prev?.estimatedCostFromBootVND ?? 0);
  const diffPct = prevCost > 0 ? ((bootCost - prevCost) / prevCost) * 100 : 0;
  const isDown = diffPct < 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Tong quan chi phi dien</h3>
            <p className="text-xs text-slate-400">Gia dien: {rate.toLocaleString("vi-VN")} VND/kWh</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full border ${
            isDown ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}
        >
          {isDown ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
          {Math.abs(diffPct).toFixed(1)}% so voi mau truoc
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/60 border border-slate-700/50">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-5">
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Uoc tinh 24h theo cong suat hien tai
              </p>
              <div className="text-4xl font-bold text-emerald-400">{fmtVnd(estimatedDayCost)}</div>
              <p className="text-sm text-slate-400 mt-1">{estimatedDayKwh.toFixed(3)} kWh/ngay (uoc tinh)</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Tu luc boot</p>
              <div className="text-2xl font-semibold text-slate-300">{fmtVnd(bootCost)}</div>
              <p className="text-xs text-slate-500 mt-1">{bootKwh.toFixed(3)} kWh</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Cong suat hien tai</span>
              <span>{realtimeW.toFixed(1)} W</span>
            </div>
            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${Math.min(100, (realtimeW / 300) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Realtime</span>
            </div>
            <div className="text-xl font-bold text-white">{realtimeW.toFixed(1)} W</div>
            <div className="text-xs text-slate-500 mt-1">Doc truc tiep tu collector</div>
          </div>

          <div className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Tu boot</span>
            </div>
            <div className="text-xl font-bold text-white">{bootKwh.toFixed(3)} kWh</div>
            <div className="text-xs text-slate-500 mt-1">Tong dien nang tich luy</div>
          </div>

          <div className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Avg tu boot</span>
            </div>
            <div className="text-xl font-bold text-white">{Number(latest?.avgWFromBoot ?? 0).toFixed(1)} W</div>
            <div className="text-xs text-slate-500 mt-1">Gia lap theo avg cong suat</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [uptime, setUptime] = useState(0);
  const [latest, setLatest] = useState<Metric | null>(null);
  const [history, setHistory] = useState<Metric[]>([]);
  const [page, setPage] = useState<"overview" | "hardware" | "power" | "settings">("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let t: any;
    const load = async () => {
      try {
        const res = await fetch("/api/metrics", { cache: "no-store" });
        const data = await res.json();
        if (data?.ok) {
          setLatest(data.latest || null);
          setHistory(Array.isArray(data.history) ? data.history : []);
          if (typeof data?.latest?.uptimeHours === "number") {
            setUptime(Math.floor(data.latest.uptimeHours * 3600));
          }
        }
      } catch {}
      t = setTimeout(load, 5000);
    };
    load();

    const tick = setInterval(() => setUptime((prev) => prev + 1), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(tick);
    };
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const navItems = [
    { key: "overview", label: "Tong quan", icon: Activity },
    { key: "hardware", label: "Phan cung", icon: Cpu },
    { key: "power", label: "Dien nang", icon: Zap },
    { key: "settings", label: "Cai dat", icon: Settings },
  ] as const;

  const pageTitles: Record<string, string> = {
    overview: "Bang dieu khien",
    hardware: "Phan cung",
    power: "Dien nang",
    settings: "Cai dat",
  };

  const chartData = useMemo<ChartPoint[]>(() => {
    const rows = history.slice(0, 8).reverse();
    return rows.map((x) => ({
      time: new Date(x.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      power: Number(x.realtimeEstimatedW || 0),
    }));
  }, [history]);

  const currentPower = latest ? `${Number(latest.realtimeEstimatedW).toFixed(1)} W` : "---";
  const bootKwh = latest ? `${Number(latest.estimatedKwhFromBoot).toFixed(3)} kWh` : "---";
  const costVnd = latest ? `${Number(latest.estimatedCostFromBootVND).toLocaleString("vi-VN")} VND` : "---";

  const ramUsed = Number(latest?.ramUsedGB ?? 0);
  const ramTotal = Number(latest?.ramTotalGB ?? 0);
  const diskTotal = Number(latest?.diskTotalGB ?? 0);
  const diskFree = Number(latest?.diskFreeGB ?? 0);
  const diskUsed = Math.max(0, diskTotal - diskFree);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex">
      <aside
        className={`w-64 bg-slate-950 border-r border-slate-800 flex flex-col fixed inset-y-0 z-30 transition-transform duration-300 md:translate-x-0 md:static md:flex ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight">PC Monitrix</h1>
            <p className="text-xs text-slate-500">System Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setPage(item.key);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-left ${
                  active
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Icon className="w-5 h-5" /> {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 flex items-center gap-3">
            <Server className="w-8 h-8 text-slate-500" />
            <div>
              <div className="text-sm font-medium text-white">{latest?.host || "NAM-PC"}</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen((v) => !v)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-white">{pageTitles[page]}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400 hidden sm:block">
              Uptime: <span className="text-white font-medium">{formatUptime(uptime)}</span>
            </div>
            <button className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {page === "overview" && (
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Thoi gian hoat dong"
                  value={formatUptime(uptime)}
                  subtitle="Ke tu lan khoi dong cuoi"
                  icon={Clock}
                  colorClass="bg-blue-500 text-blue-400"
                />
                <MetricCard
                  title="Cong suat hien tai"
                  value={currentPower}
                  subtitle="Cong suat realtime tu may local"
                  icon={Zap}
                  colorClass="bg-amber-500 text-amber-400"
                />
                <MetricCard
                  title="So dien tieu thu"
                  value={bootKwh}
                  subtitle="kWh tinh tu luc may boot"
                  icon={TrendingUp}
                  colorClass="bg-indigo-500 text-indigo-400"
                />
                <MetricCard
                  title="Tien dien uoc tinh"
                  value={costVnd}
                  subtitle={`Tinh theo gia ${latest?.ratePerKwhVND ? Number(latest.ratePerKwhVND).toLocaleString("vi-VN") : "---"} VND/kWh`}
                  icon={DollarSign}
                  colorClass="bg-emerald-500 text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Bieu do tieu thu dien</h3>
                      <p className="text-sm text-slate-400">Du lieu that tu cac mau gan day</p>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <SvgAreaChart data={chartData} />
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm flex flex-col">
                  <h3 className="text-lg font-semibold text-white mb-1">Trang thai phan cung</h3>
                  <p className="text-sm text-slate-400 mb-6">Thong so he thong theo thoi gian thuc</p>

                  <div className="space-y-6 flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Cpu className="w-4 h-4 text-blue-400" /> CPU
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">{latest?.cpuName || "Khong co ten CPU"}</div>
                      <ProgressBar label="Load" value={Number(latest?.cpuPercent ?? 0).toFixed(1)} max={100} unit="%" color="bg-blue-500" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Monitor className="w-4 h-4 text-emerald-400" /> GPU
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">{latest?.gpuName || "Khong co ten GPU"}</div>
                      <ProgressBar label="Power hint" value={Number(latest?.realtimeEstimatedW ?? 0).toFixed(1)} max={300} unit="W" color="bg-emerald-500" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Activity className="w-4 h-4 text-amber-400" /> RAM
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">{latest?.osName || "Windows"}</div>
                      <ProgressBar label="Usage" value={ramUsed.toFixed(2)} max={Math.max(1, ramTotal).toFixed(2)} unit="GB" color="bg-amber-500" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <HardDrive className="w-4 h-4 text-purple-400" /> Luu tru
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">Disk C:</div>
                      <ProgressBar label="Space" value={diskUsed.toFixed(2)} max={Math.max(1, diskTotal).toFixed(2)} unit="GB" color="bg-purple-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-medium">CPU Load</h4>
                    <div className="text-2xl font-semibold text-white mt-1">{Number(latest?.cpuPercent ?? 0).toFixed(2)} %</div>
                    <p className="text-xs text-slate-500 mt-1">Du lieu that</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-medium">RAM da dung</h4>
                    <div className="text-2xl font-semibold text-white mt-1">
                      {ramUsed.toFixed(2)} / {ramTotal.toFixed(2)} GB
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Doc tu he thong</p>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-medium">Disk C con trong</h4>
                    <div className="text-2xl font-semibold text-white mt-1">{diskFree.toFixed(2)} GB</div>
                    <p className="text-xs text-slate-500 mt-1">Tong {diskTotal.toFixed(2)} GB</p>
                  </div>
                </div>
              </div>

              <ElectricityBillPanel latest={latest} history={history} />
            </div>
          )}

          {page === "hardware" && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard title="CPU" value={latest?.cpuName || "---"} subtitle="Model CPU" icon={Cpu} colorClass="bg-blue-500 text-blue-400" />
              <MetricCard title="GPU" value={latest?.gpuName || "---"} subtitle="Model GPU" icon={Monitor} colorClass="bg-emerald-500 text-emerald-400" />
              <MetricCard
                title="RAM"
                value={`${ramUsed.toFixed(2)} / ${ramTotal.toFixed(2)} GB`}
                subtitle="Su dung bo nho"
                icon={Activity}
                colorClass="bg-amber-500 text-amber-400"
              />
              <MetricCard
                title="Disk C"
                value={`${diskFree.toFixed(2)} GB free`}
                subtitle={`Tong ${diskTotal.toFixed(2)} GB`}
                icon={HardDrive}
                colorClass="bg-purple-500 text-purple-400"
              />
            </div>
          )}

          {page === "power" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Realtime Power" value={currentPower} subtitle="W hien tai" icon={Zap} colorClass="bg-amber-500 text-amber-400" />
                <MetricCard title="kWh tu boot" value={bootKwh} subtitle="Nang luong tich luy" icon={TrendingUp} colorClass="bg-indigo-500 text-indigo-400" />
                <MetricCard title="Chi phi tu boot" value={costVnd} subtitle="Theo gia dien dang set" icon={DollarSign} colorClass="bg-emerald-500 text-emerald-400" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm h-80">
                <SvgAreaChart data={chartData} />
              </div>
            </div>
          )}

          {page === "settings" && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Settings className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-lg">Cai dat dang phat trien...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
