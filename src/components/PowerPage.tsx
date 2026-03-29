// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Cpu,
  Monitor,
  HardDrive,
  Activity,
  Fan,
  Server,
  CalendarDays,
  Lightbulb,
  Receipt,
  ArrowUp,
  ArrowDown,
  BarChart3,
} from "lucide-react";

// ---- SVG Area Chart (no recharts) ----
interface ChartPoint { time: string; power: number; cost?: number }

function SvgAreaChart({
  data,
  color = "#8b5cf6",
  unit = "W",
  height = 220,
}: {
  data: ChartPoint[];
  color?: string;
  unit?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ChartPoint } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(e => setWidth(e[0].contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const padL = 48, padR = 16, padT = 16, padB = 36;
  const W = width - padL - padR;
  const H = height - padT - padB;

  const values = data.map(d => d.power);
  const minVal = 0;
  const maxVal = Math.ceil(Math.max(...values) / 100) * 100 + 80;

  const xOf = (i: number) => padL + (i / (data.length - 1)) * W;
  const yOf = (v: number) => padT + H - ((v - minVal) / (maxVal - minVal)) * H;

  const pathD = data.reduce((acc, pt, i) => {
    const x = xOf(i), y = yOf(pt.power);
    if (i === 0) return `M ${x},${y}`;
    const px = xOf(i - 1), py = yOf(data[i - 1].power);
    const cx = (px + x) / 2;
    return `${acc} C ${cx},${py} ${cx},${y} ${x},${y}`;
  }, "");
  const areaD = `${pathD} L ${xOf(data.length - 1)},${padT + H} L ${xOf(0)},${padT + H} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    val: Math.round(minVal + f * (maxVal - minVal)),
    y: padT + H - f * H,
  }));

  const gradId = `grad-${color.replace("#", "")}`;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left - padL;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((mx / W) * (data.length - 1))));
    setTooltip({ x: xOf(idx), y: yOf(data[idx].power), point: data[idx] });
  }, [width, data]);

  return (
    <div ref={containerRef} className="w-full relative select-none" style={{ height }}>
      <svg width={width} height={height} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map(t => (
          <g key={`y-${t.val}`}>
            <line x1={padL} y1={t.y} x2={padL + W} y2={t.y} stroke="#334155" strokeWidth={1} strokeDasharray="4 4" />
            <text x={padL - 8} y={t.y + 4} textAnchor="end" fontSize={11} fill="#94a3b8">{t.val}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={`x-${d.time}`} x={xOf(i)} y={padT + H + 20} textAnchor="middle" fontSize={11} fill="#94a3b8">{d.time}</text>
        ))}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {tooltip && (
          <>
            <line x1={tooltip.x} y1={padT} x2={tooltip.x} y2={padT + H} stroke={color} strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
            <circle cx={tooltip.x} cy={tooltip.y} r={5} fill={color} stroke="#1e293b" strokeWidth={2} />
          </>
        )}
      </svg>
      {tooltip && (() => {
        const boxW = 120;
        const rawLeft = tooltip.x + 14;
        const left = rawLeft + boxW > width ? tooltip.x - boxW - 14 : rawLeft;
        return (
          <div
            className="absolute pointer-events-none bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg"
            style={{ left, top: tooltip.y - 40 }}
          >
            <div className="text-slate-400 mb-0.5">{tooltip.point.time}</div>
            <div className="font-semibold" style={{ color }}>{tooltip.point.power} {unit}</div>
          </div>
        );
      })()}
    </div>
  );
}

// ---- Bar chart for weekly ----
function WeeklyBarChart({ data }: { data: { day: string; kwh: number; cost: number }[] }) {
  const maxKwh = Math.max(...data.map(d => d.kwh)) * 1.2;
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d, i) => {
        const pct = (d.kwh / maxKwh) * 100;
        const isToday = i === data.length - 1;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {d.kwh}kWh
            </div>
            <div className="w-full relative flex justify-center" style={{ height: 96 }}>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${isToday ? "bg-indigo-500" : "bg-slate-600 group-hover:bg-slate-500"}`}
                style={{ height: `${pct}%`, alignSelf: "flex-end" }}
              />
            </div>
            <div className={`text-xs font-medium ${isToday ? "text-indigo-400" : "text-slate-500"}`}>{d.day}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Thin progress bar ----
function ThinBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  );
}

// ---- Circular gauge ----
function CircularGauge({ value, max = 100, size = 100, strokeWidth = 9, color, label, unit = "%" }: {
  value: number; max?: number; size?: number; strokeWidth?: number; color: string; label: string; unit?: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / max, 1) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-bold" style={{ fontSize: size * 0.18, lineHeight: 1 }}>{value}</span>
          <span className="text-slate-400" style={{ fontSize: size * 0.12 }}>{unit}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

// ---- Mock data ----
const dailyData: ChartPoint[] = [
  { time: "00:00", power: 120 }, { time: "02:00", power: 105 }, { time: "04:00", power: 110 },
  { time: "06:00", power: 180 }, { time: "08:00", power: 450 }, { time: "10:00", power: 520 },
  { time: "12:00", power: 580 }, { time: "14:00", power: 610 }, { time: "16:00", power: 620 },
  { time: "18:00", power: 700 }, { time: "20:00", power: 750 }, { time: "22:00", power: 480 },
  { time: "24:00", power: 300 },
];

const weeklyData = [
  { day: "T2", kwh: 12.4, cost: 37200 }, { day: "T3", kwh: 14.1, cost: 42300 },
  { day: "T4", kwh: 13.7, cost: 41100 }, { day: "T5", kwh: 15.2, cost: 45600 },
  { day: "T6", kwh: 16.8, cost: 50400 }, { day: "T7", kwh: 18.3, cost: 54900 },
  { day: "CN", kwh: 14.5, cost: 43500 },
];

const RATE = 3000;
const components = [
  { label: "CPU", icon: Cpu, watts: 87, max: 253, color: "#3b82f6" },
  { label: "GPU", icon: Monitor, watts: 312, max: 450, color: "#10b981" },
  { label: "Mainboard", icon: Server, watts: 28, max: 80, color: "#6366f1" },
  { label: "RAM", icon: Activity, watts: 8, max: 30, color: "#f59e0b" },
  { label: "Storage", icon: HardDrive, watts: 12, max: 30, color: "#8b5cf6" },
  { label: "Fans", icon: Fan, watts: 13, max: 25, color: "#06b6d4" },
];

// ---- Live wattage ----
function useLive(base: number, range: number, interval = 1500) {
  const [v, setV] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setV(Math.round(Math.max(0, base + (Math.random() - 0.5) * range))), interval);
    return () => clearInterval(id);
  }, []);
  return v;
}

// ============================
//   Main Power Page
// ============================
export function PowerPage() {
  const totalWatts = useLive(452, 40);
  const [view, setView] = useState<"day" | "week">("day");

  const RATE_PER_KWH = 3000;
  const billData = { todayKwh: 4.82, monthKwh: 14.5, forecastKwh: 28.6, lastMonthKwh: 31.2, daysInMonth: 31, currentDay: 16 };
  const monthCost = billData.monthKwh * RATE_PER_KWH;
  const forecastCost = billData.forecastKwh * RATE_PER_KWH;
  const lastMonthCost = billData.lastMonthKwh * RATE_PER_KWH;
  const diffPct = ((billData.forecastKwh - billData.lastMonthKwh) / billData.lastMonthKwh) * 100;
  const monthProgress = (billData.currentDay / billData.daysInMonth) * 100;
  const fmt = (n: number) => n.toLocaleString("vi-VN") + " Ä‘";
  const psyEff = 92;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Äiá»‡n NÄƒng</h2>
        <p className="text-sm text-slate-400 mt-1">GiÃ¡m sÃ¡t tiÃªu thá»¥ Ä‘iá»‡n vÃ  chi phÃ­ theo thá»i gian thá»±c</p>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "CÃ´ng suáº¥t hiá»‡n táº¡i", value: `${totalWatts} W`, sub: "Äá»‰nh hÃ´m nay: 780W", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Zap },
          { label: "HÃ´m nay", value: `${billData.todayKwh} kWh`, sub: `â‰ˆ ${fmt(billData.todayKwh * RATE_PER_KWH)}`, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: CalendarDays },
          { label: "ThÃ¡ng nÃ y", value: `${billData.monthKwh} kWh`, sub: fmt(monthCost), color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: TrendingUp },
          { label: "Dá»± bÃ¡o thÃ¡ng", value: fmt(forecastCost), sub: `${billData.forecastKwh} kWh`, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: Receipt },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`bg-slate-800 border ${k.border} rounded-xl p-5 flex gap-4 items-start`}>
              <div className={`w-10 h-10 rounded-lg ${k.bg} border ${k.border} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">{k.label}</div>
                <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + PSU row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-white font-semibold">Biá»ƒu Äá»“ TiÃªu Thá»¥ Äiá»‡n</h3>
              <p className="text-xs text-slate-400 mt-0.5">Watt theo thá»i gian</p>
            </div>
            <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
              {(["day", "week"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === v ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {v === "day" ? "24 giá»" : "7 ngÃ y"}
                </button>
              ))}
            </div>
          </div>

          {view === "day" ? (
            <SvgAreaChart data={dailyData} color="#8b5cf6" unit="W" height={220} />
          ) : (
            <div className="px-2">
              <WeeklyBarChart data={weeklyData} />
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Tá»•ng tuáº§n: {weeklyData.reduce((s, d) => s + d.kwh, 0).toFixed(1)} kWh</span>
                <span>Chi phÃ­: {fmt(weeklyData.reduce((s, d) => s + d.cost, 0))}</span>
              </div>
            </div>
          )}
        </div>

        {/* PSU panel */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col">
          <h3 className="text-white font-semibold mb-1">Nguá»“n Äiá»‡n (PSU)</h3>
          <p className="text-xs text-slate-400 mb-5">Corsair HX1000i Â· 1000W Â· 80+ Platinum</p>

          <div className="flex flex-col items-center mb-5">
            <CircularGauge value={totalWatts} max={1000} size={130} strokeWidth={11} color="#f59e0b" label="Tá»•ng táº£i" unit="W" />
          </div>

          <div className="space-y-3 flex-1">
            {[
              { label: "Hiá»‡u suáº¥t", value: `${psyEff}%`, color: "text-emerald-400" },
              { label: "Táº£i PSU", value: `${Math.round((totalWatts / 1000) * 100)}%`, color: "text-amber-400" },
              { label: "CÃ´ng suáº¥t thá»±c", value: `${Math.round(totalWatts / (psyEff / 100))} W`, color: "text-slate-300" },
              { label: "Chá»©ng nháº­n", value: "80+ Platinum", color: "text-yellow-400" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-sm text-slate-400">{r.label}</span>
                <span className={`text-sm font-semibold ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300">PSU Ä‘ang hoáº¡t Ä‘á»™ng trong vÃ¹ng hiá»‡u suáº¥t tá»‘i Æ°u (40â€“80% táº£i).</p>
          </div>
        </div>
      </div>

      {/* Component power breakdown */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-1">PhÃ¢n Bá»• CÃ´ng Suáº¥t Theo Linh Kiá»‡n</h3>
        <p className="text-xs text-slate-400 mb-5">Tá»•ng: {totalWatts} W táº¡i thá»i Ä‘iá»ƒm hiá»‡n táº¡i</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map(c => {
            const Icon = c.icon;
            const pct = Math.round((c.watts / totalWatts) * 100);
            return (
              <div key={c.label} className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: c.color }} />
                    <span className="text-sm text-slate-300 font-medium">{c.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{c.watts} W</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(c.watts / c.max) * 100}%`, background: c.color }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{pct}% tá»•ng há»‡ thá»‘ng</span>
                  <span>TDP: {c.max}W</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bill panel */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Tá»•ng Tiá»n Äiá»‡n</h3>
              <p className="text-xs text-slate-400">GiÃ¡: {RATE_PER_KWH.toLocaleString("vi-VN")} Ä‘/kWh</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border ${diffPct < 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
            {diffPct < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {Math.abs(diffPct).toFixed(1)}% so vá»›i thÃ¡ng trÆ°á»›c
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/60 border border-slate-700/50">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-5">
              <div>
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Dá»± bÃ¡o cuá»‘i thÃ¡ng {new Date().getMonth() + 1}
                </p>
                <div className="text-4xl font-bold text-emerald-400">{fmt(forecastCost)}</div>
                <p className="text-sm text-slate-400 mt-1">{billData.forecastKwh} kWh Æ°á»›c tÃ­nh</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">ThÃ¡ng trÆ°á»›c</p>
                <div className="text-2xl font-semibold text-slate-400">{fmt(lastMonthCost)}</div>
                <p className="text-xs text-slate-500 mt-1">{billData.lastMonthKwh} kWh</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>NgÃ y {billData.currentDay} / {billData.daysInMonth} trong thÃ¡ng</span>
                <span>{monthProgress.toFixed(0)}% Ä‘Ã£ qua</span>
              </div>
              <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700" style={{ width: `${monthProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: "HÃ´m nay", icon: Zap, color: "text-amber-400", iconColor: "#f59e0b", kwh: billData.todayKwh },
              { label: "ThÃ¡ng nÃ y", icon: CalendarDays, color: "text-indigo-400", iconColor: "#6366f1", kwh: billData.monthKwh },
              { label: "TB / ngÃ y", icon: BarChart3, color: "text-purple-400", iconColor: "#8b5cf6", kwh: +(billData.monthKwh / billData.currentDay).toFixed(2) },
            ].map(r => {
              const Icon = r.icon;
              return (
                <div key={r.label} className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: r.iconColor }} />
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{r.label}</span>
                  </div>
                  <div className={`text-xl font-bold ${r.color}`}>{fmt(r.kwh * RATE_PER_KWH)}</div>
                  <div className="text-xs text-slate-500 mt-1">{r.kwh} kWh</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}




