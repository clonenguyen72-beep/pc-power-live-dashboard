// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity,
  Cpu,
  Zap,
  Clock,
  HardDrive,
  Monitor,
  Fan,
  Thermometer,
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
import { HardwarePage } from "./HardwarePage";
import { PowerPage } from "./PowerPage";

// --- Custom SVG Area Chart (no recharts) ---
interface ChartPoint { time: string; power: number }

function SvgAreaChart({ data }: { data: ChartPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 288 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: ChartPoint } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ width, height });
    });
    ro.observe(el);
    setDims({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const padL = 48, padR = 16, padT = 16, padB = 36;
  const W = dims.width - padL - padR;
  const H = dims.height - padT - padB;

  const minVal = 0;
  const maxVal = Math.ceil(Math.max(...data.map(d => d.power)) / 100) * 100 + 50;

  const xOf = (i: number) => padL + (i / (data.length - 1)) * W;
  const yOf = (v: number) => padT + H - ((v - minVal) / (maxVal - minVal)) * H;

  // Build smooth path using cubic bezier
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

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    val: Math.round(minVal + f * (maxVal - minVal)),
    y: padT + H - f * H,
  }));

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left - padL;
    const ratio = mx / W;
    const idx = Math.round(ratio * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    const pt = data[clamped];
    setTooltip({ x: xOf(clamped), y: yOf(pt.power), point: pt });
  }, [dims, data]);

  return (
    <div ref={containerRef} className="w-full h-full relative select-none">
      <svg
        width={dims.width}
        height={dims.height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((t) => (
          <line
            key={`grid-${t.val}`}
            x1={padL} y1={t.y} x2={padL + W} y2={t.y}
            stroke="#334155" strokeWidth={1} strokeDasharray="4 4"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((t) => (
          <text
            key={`ylabel-${t.val}`}
            x={padL - 8} y={t.y + 4}
            textAnchor="end" fontSize={11} fill="#94a3b8"
          >
            {t.val}
          </text>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={`xlabel-${d.time}`}
            x={xOf(i)} y={padT + H + 20}
            textAnchor="middle" fontSize={11} fill="#94a3b8"
          >
            {d.time}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Tooltip crosshair */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x} y1={padT}
              x2={tooltip.x} y2={padT + H}
              stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 4" opacity={0.6}
            />
            <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="#8b5cf6" stroke="#1e293b" strokeWidth={2} />
          </>
        )}
      </svg>

      {/* Tooltip box */}
      {tooltip && (() => {
        const boxW = 110;
        const svgW = dims.width;
        const rawLeft = tooltip.x + 12;
        const left = rawLeft + boxW > svgW ? tooltip.x - boxW - 12 : rawLeft;
        return (
          <div
            className="absolute pointer-events-none bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg"
            style={{ left, top: tooltip.y - 36 }}
          >
            <div className="text-slate-400">{tooltip.point.time}</div>
            <div className="text-purple-400 font-semibold">{tooltip.point.power} W</div>
          </div>
        );
      })()}
    </div>
  );
}
// --- End Custom SVG Area Chart ---

// --- Power chart data ---
const powerData = [
  { time: "00:00", power: 120 },
  { time: "04:00", power: 110 },
  { time: "08:00", power: 450 },
  { time: "12:00", power: 580 },
  { time: "16:00", power: 620 },
  { time: "20:00", power: 750 },
  { time: "24:00", power: 300 },
];

// --- Electricity Bill Panel ---
const RATE_PER_KWH = 3000; // VNÄ
const billData = {
  todayKwh: 4.82,
  monthKwh: 14.5,
  forecastKwh: 28.6,
  lastMonthKwh: 31.2,
  daysInMonth: 31,
  currentDay: 16,
};

function ElectricityBillPanel() {
  const todayCost = billData.todayKwh * RATE_PER_KWH;
  const monthCost = billData.monthKwh * RATE_PER_KWH;
  const forecastCost = billData.forecastKwh * RATE_PER_KWH;
  const lastMonthCost = billData.lastMonthKwh * RATE_PER_KWH;
  const monthProgress = (billData.currentDay / billData.daysInMonth) * 100;
  const diffPct = ((billData.forecastKwh - billData.lastMonthKwh) / billData.lastMonthKwh) * 100;
  const isDown = diffPct < 0;
  const fmt = (n: number) => n.toLocaleString("vi-VN") + " Ä‘";

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Tá»•ng Tiá»n Äiá»‡n</h3>
            <p className="text-xs text-slate-400">GiÃ¡ Ä‘iá»‡n: {RATE_PER_KWH.toLocaleString("vi-VN")} Ä‘/kWh</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full border ${isDown ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}>
          {isDown ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
          {Math.abs(diffPct).toFixed(1)}% so vá»›i thÃ¡ng trÆ°á»›c
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big Forecast Number */}
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
          {/* Monthly progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>NgÃ y {billData.currentDay} / {billData.daysInMonth} trong thÃ¡ng</span>
              <span>{monthProgress.toFixed(0)}% Ä‘Ã£ qua</span>
            </div>
            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${monthProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Breakdown column */}
        <div className="flex flex-col gap-3">
          <div className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">HÃ´m nay</span>
            </div>
            <div className="text-xl font-bold text-white">{fmt(todayCost)}</div>
            <div className="text-xs text-slate-500 mt-1">{billData.todayKwh} kWh</div>
          </div>
          <div className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">ThÃ¡ng nÃ y</span>
            </div>
            <div className="text-xl font-bold text-white">{fmt(monthCost)}</div>
            <div className="text-xs text-slate-500 mt-1">{billData.monthKwh} kWh</div>
          </div>
          <div className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">TB / ngÃ y</span>
            </div>
            <div className="text-xl font-bold text-white">
              {fmt(Math.round(monthCost / billData.currentDay))}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {(billData.monthKwh / billData.currentDay).toFixed(2)} kWh/ngÃ y
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- End Electricity Bill Panel ---

const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${colorClass}`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
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
  const percentage = (value / max) * 100;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-400">{value}{unit} / {max}{unit}</span>
      </div>
      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export function Dashboard() {
  const [uptime, setUptime] = useState(0);
  const [page, setPage] = useState<"overview" | "hardware" | "power" | "settings">("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUptime(5 * 3600 + 23 * 60 + 15);
    const interval = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const navItems = [
    { key: "overview", label: "Tá»•ng quan", icon: Activity },
    { key: "hardware", label: "Pháº§n cá»©ng", icon: Cpu },
    { key: "power", label: "Äiá»‡n nÄƒng", icon: Zap },
    { key: "settings", label: "CÃ i Ä‘áº·t", icon: Settings },
  ] as const;

  const pageTitles: Record<string, string> = {
    overview: "Báº£ng Äiá»u Khiá»ƒn",
    hardware: "Pháº§n Cá»©ng",
    power: "Äiá»‡n NÄƒng",
    settings: "CÃ i Äáº·t",
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex">
      {/* Sidebar */}
      <aside className={`w-64 bg-slate-950 border-r border-slate-800 flex flex-col fixed inset-y-0 z-30 transition-transform duration-300 md:translate-x-0 md:static md:flex ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
          {navItems.map(item => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setPage(item.key); setMobileMenuOpen(false); }}
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
              <div className="text-sm font-medium text-white">GAMING-RIG-99</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(v => !v)}>
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

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {page === "overview" && <OverviewPage uptime={uptime} formatUptime={formatUptime} />}
          {page === "hardware" && <HardwarePage />}
          {page === "power" && <PowerPage />}
          {page === "settings" && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Settings className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-lg">CÃ i Ä‘áº·t Ä‘ang phÃ¡t triá»ƒn...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function OverviewPage({ uptime, formatUptime }: { uptime: number; formatUptime: (totalSeconds: number) => string }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Thá»i Gian Hoáº¡t Äá»™ng" 
            value={formatUptime(uptime)}
            subtitle="Ká»ƒ tá»« láº§n khá»Ÿi Ä‘á»™ng cuá»‘i"
            icon={Clock}
            colorClass="bg-blue-500 text-blue-400"
          />
          <MetricCard 
            title="CÃ´ng Suáº¥t Hiá»‡n Táº¡i" 
            value="452 W"
            subtitle="Äá»‰nh Ä‘iá»ƒm hÃ´m nay: 780W"
            icon={Zap}
            colorClass="bg-amber-500 text-amber-400"
          />
          <MetricCard 
            title="Sá»‘ Äiá»‡n TiÃªu Thá»¥" 
            value="14.5 kWh"
            subtitle="Tá»•ng cá»™ng trong thÃ¡ng nÃ y"
            icon={TrendingUp}
            colorClass="bg-indigo-500 text-indigo-400"
          />
          <MetricCard 
            title="Tiá»n Äiá»‡n Æ¯á»›c TÃ­nh" 
            value="43,500 Ä‘"
            subtitle="TÃ­nh theo giÃ¡ 3,000Ä‘/kWh"
            icon={DollarSign}
            colorClass="bg-emerald-500 text-emerald-400"
          />
        </div>

        {/* Charts & System Specs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Power Chart */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Biá»ƒu Äá»“ TiÃªu Thá»¥ Äiá»‡n</h3>
                <p className="text-sm text-slate-400">Äiá»‡n nÄƒng sá»­ dá»¥ng trong 24 giá» qua (W)</p>
              </div>
              <select className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2">
                <option>HÃ´m nay</option>
                <option>7 ngÃ y qua</option>
                <option>ThÃ¡ng nÃ y</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <SvgAreaChart data={powerData} />
            </div>
          </div>

          {/* Hardware Monitoring */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-1">Tráº¡ng ThÃ¡i Pháº§n Cá»©ng</h3>
            <p className="text-sm text-slate-400 mb-6">ThÃ´ng sá»‘ há»‡ thá»‘ng theo thá»i gian thá»±c</p>
            
            <div className="space-y-6 flex-1">
              {/* CPU */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Cpu className="w-4 h-4 text-blue-400" /> CPU
                  </div>
                  <div className="text-xs text-slate-400 flex gap-3">
                    <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> 62Â°C</span>
                    <span className="flex items-center gap-1"><Fan className="w-3 h-3" /> 1200 RPM</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-2">Intel Core i9-13900K</div>
                <ProgressBar label="Load" value={35} max={100} unit="%" color="bg-blue-500" />
              </div>

              {/* GPU */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Monitor className="w-4 h-4 text-emerald-400" /> GPU
                  </div>
                  <div className="text-xs text-slate-400 flex gap-3">
                    <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> 70Â°C</span>
                    <span className="flex items-center gap-1"><Fan className="w-3 h-3" /> 1800 RPM</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-2">NVIDIA GeForce RTX 4090</div>
                <ProgressBar label="Load" value={68} max={100} unit="%" color="bg-emerald-500" />
              </div>

              {/* RAM */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Activity className="w-4 h-4 text-amber-400" /> RAM
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-2">DDR5 6000MHz</div>
                <ProgressBar label="Usage" value={18.5} max={32} unit="GB" color="bg-amber-500" />
              </div>
              
              {/* Storage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <HardDrive className="w-4 h-4 text-purple-400" /> LÆ°u Trá»¯
                  </div>
                </div>
                <div className="text-xs text-slate-500 mb-2">WD Black SN850X NVMe (C:)</div>
                <ProgressBar label="Space" value={450} max={1000} unit="GB" color="bg-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-slate-300 font-medium">Äiá»‡n Ã¡p CPU</h4>
              <div className="text-2xl font-semibold text-white mt-1">1.25 V</div>
              <p className="text-xs text-slate-500 mt-1">BÃ¬nh thÆ°á»ng</p>
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-slate-300 font-medium">Äiá»‡n Ã¡p GPU</h4>
              <div className="text-2xl font-semibold text-white mt-1">1.05 V</div>
              <p className="text-xs text-slate-500 mt-1">BÃ¬nh thÆ°á»ng</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-slate-300 font-medium">Hiá»‡u suáº¥t Nguá»“n (PSU)</h4>
              <div className="text-2xl font-semibold text-white mt-1">92 %</div>
              <p className="text-xs text-slate-500 mt-1">80 Plus Platinum</p>
            </div>
          </div>
        </div>

        {/* Electricity Bill Panel */}
        <ElectricityBillPanel />
      </div>
    </div>
  );
}





