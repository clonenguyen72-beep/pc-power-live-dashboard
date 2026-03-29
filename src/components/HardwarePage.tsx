// @ts-nocheck
"use client";
import React, { useState, useEffect } from "react";
import {
  Cpu,
  Monitor,
  Activity,
  HardDrive,
  Fan,
  Thermometer,
  Zap,
  Wifi,
  CheckCircle,
} from "lucide-react";

// ---------- Circular Gauge ----------
function CircularGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color,
  label,
  unit = "%",
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  unit?: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white" style={{ fontSize: size * 0.18, fontWeight: 700, lineHeight: 1 }}>
            {value}
          </span>
          <span className="text-slate-400" style={{ fontSize: size * 0.11 }}>{unit}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

// ---------- Mini Sparkline ----------
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 80, h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values) || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min + 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- Bar ----------
function ThinBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${(value / max) * 100}%`, background: color }}
      />
    </div>
  );
}

// ---------- Status badge ----------
function StatusBadge({ status }: { status: "ok" | "warn" | "hot" }) {
  const map = {
    ok: { label: "BÃ¬nh thÆ°á»ng", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    warn: { label: "ChÃº Ã½", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    hot: { label: "NÃ³ng", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  };
  const { label, color } = map[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>{label}</span>
  );
}

// ---------- Animated tick for live values ----------
function useLiveValues(base: number[], range: number, interval = 2000) {
  const [vals, setVals] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setVals(prev => prev.map(v => Math.max(0, Math.min(100, v + (Math.random() - 0.5) * range))));
    }, interval);
    return () => clearInterval(id);
  }, []);
  return vals.map(v => Math.round(v));
}

// ---------- Sparkline history ----------
function useHistory(value: number, maxLen = 20) {
  const [history, setHistory] = useState<number[]>(Array(maxLen).fill(value));
  useEffect(() => {
    setHistory(prev => [...prev.slice(1), value]);
  }, [value]);
  return history;
}

// ============================
//   Sub-components per device
// ============================

function CpuCard() {
  const [cpuLoad, gpuLoad] = useLiveValues([35, 68], 8);
  const [temp] = useLiveValues([62], 3);
  const cpuTemp = temp;
  const history = useHistory(cpuLoad);

  const cores = [
    { id: 0, load: 42, freq: 5.2 },
    { id: 1, load: 28, freq: 4.8 },
    { id: 2, load: 55, freq: 5.1 },
    { id: 3, load: 18, freq: 4.5 },
    { id: 4, load: 61, freq: 5.3 },
    { id: 5, load: 34, freq: 4.9 },
    { id: 6, load: 22, freq: 4.6 },
    { id: 7, load: 47, freq: 5.0 },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Bá»™ Xá»­ LÃ½ (CPU)</h3>
            <p className="text-xs text-slate-400">Intel Core i9-13900K Â· LGA1700</p>
          </div>
        </div>
        <StatusBadge status={cpuTemp > 75 ? "hot" : cpuTemp > 65 ? "warn" : "ok"} />
      </div>

      {/* Gauges row */}
      <div className="flex items-center justify-around mb-6">
        <CircularGauge value={cpuLoad} color="#3b82f6" label="CPU Load" size={110} />
        <CircularGauge value={cpuTemp} max={100} color="#f59e0b" label="Nhiá»‡t Ä‘á»™" unit="Â°C" size={110} />
        <CircularGauge value={1200} max={3000} color="#8b5cf6" label="Fan" unit="RPM" size={110} />
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "NhÃ¢n / Luá»“ng", value: "24C / 32T" },
          { label: "Xung cÆ¡ sá»Ÿ", value: "3.0 GHz" },
          { label: "Xung boost", value: "5.8 GHz" },
          { label: "Äiá»‡n Ã¡p", value: "1.25 V" },
          { label: "TDP", value: "125 W" },
          { label: "Cache L3", value: "36 MB" },
          { label: "Tiáº¿n trÃ¬nh", value: "Intel 7" },
          { label: "CÃ´ng suáº¥t", value: "87 W" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className="text-sm text-white font-medium">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Per-core loads */}
      <div>
        <div className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Táº£i tá»«ng lÃµi (P-Core)</div>
        <div className="grid grid-cols-2 gap-2">
          {cores.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-12">Core {c.id}</span>
              <div className="flex-1">
                <ThinBar value={c.load} color="#3b82f6" />
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">{c.load}%</span>
              <span className="text-xs text-slate-500 w-14 text-right">{c.freq}GHz</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GpuCard() {
  const [gpuLoad] = useLiveValues([68], 10);
  const [gpuTemp] = useLiveValues([70], 4);
  const [memLoad] = useLiveValues([54], 6);
  const history = useHistory(gpuLoad);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Card Äá»“ Há»a (GPU)</h3>
            <p className="text-xs text-slate-400">NVIDIA GeForce RTX 4090 Â· PCIe 4.0 x16</p>
          </div>
        </div>
        <StatusBadge status={gpuTemp > 80 ? "hot" : gpuTemp > 70 ? "warn" : "ok"} />
      </div>

      <div className="flex items-center justify-around mb-6">
        <CircularGauge value={gpuLoad} color="#10b981" label="GPU Load" size={110} />
        <CircularGauge value={gpuTemp} max={100} color="#f59e0b" label="Nhiá»‡t Ä‘á»™" unit="Â°C" size={110} />
        <CircularGauge value={memLoad} color="#6366f1" label="VRAM" size={110} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "VRAM", value: "24 GB GDDR6X" },
          { label: "Xung GPU", value: "2520 MHz" },
          { label: "Xung VRAM", value: "10752 MHz" },
          { label: "Äiá»‡n Ã¡p", value: "1.05 V" },
          { label: "TDP", value: "450 W" },
          { label: "Shader", value: "16,384" },
          { label: "Bus", value: "384-bit" },
          { label: "CÃ´ng suáº¥t", value: "312 W" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className="text-sm text-white font-medium">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Fan speeds */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Fan 1", rpm: 1820, pct: 62 },
          { label: "Fan 2", rpm: 1780, pct: 60 },
          { label: "Fan 3", rpm: 1850, pct: 63 },
        ].map(f => (
          <div key={f.label} className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-3 text-center">
            <Fan className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-medium text-white">{f.rpm} RPM</div>
            <div className="text-xs text-slate-500 mt-1">{f.label} Â· {f.pct}%</div>
            <div className="mt-2">
              <ThinBar value={f.pct} color="#10b981" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RamCard() {
  const slots = [
    { id: "A1", size: "16 GB", speed: "6000 MHz", type: "DDR5", voltage: "1.35V", used: 9.2, total: 16 },
    { id: "A2", size: "Trá»‘ng", speed: "â€”", type: "â€”", voltage: "â€”", used: 0, total: 0 },
    { id: "B1", size: "16 GB", speed: "6000 MHz", type: "DDR5", voltage: "1.35V", used: 9.3, total: 16 },
    { id: "B2", size: "Trá»‘ng", speed: "â€”", type: "â€”", voltage: "â€”", used: 0, total: 0 },
  ];
  const totalUsed = 18.5;
  const totalCap = 32;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Bá»™ Nhá»› (RAM)</h3>
            <p className="text-xs text-slate-400">DDR5 Â· Dual Channel Â· XMP 3.0</p>
          </div>
        </div>
        <StatusBadge status="ok" />
      </div>

      {/* Overview */}
      <div className="flex items-center gap-6 mb-5 p-4 bg-slate-900/50 border border-slate-700/40 rounded-xl">
        <CircularGauge value={Math.round((totalUsed / totalCap) * 100)} color="#f59e0b" label="Sá»­ dá»¥ng" size={90} />
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">ÄÃ£ dÃ¹ng</span>
              <span className="text-white font-medium">{totalUsed} GB / {totalCap} GB</span>
            </div>
            <ThinBar value={totalUsed} max={totalCap} color="#f59e0b" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Tá»‘c Ä‘á»™:</span> <span className="text-white">6000 MT/s</span></div>
            <div><span className="text-slate-500">Latency:</span> <span className="text-white">CL30</span></div>
            <div><span className="text-slate-500">Äiá»‡n Ã¡p:</span> <span className="text-white">1.35 V</span></div>
            <div><span className="text-slate-500">KÃªnh:</span> <span className="text-white">Dual</span></div>
          </div>
        </div>
      </div>

      {/* Slots */}
      <div className="grid grid-cols-2 gap-3">
        {slots.map(slot => (
          <div key={slot.id} className={`rounded-lg p-4 border ${slot.size === "Trá»‘ng" ? "border-slate-700/30 bg-slate-900/20 opacity-50" : "border-slate-700/40 bg-slate-900/50"}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-300">Slot {slot.id}</span>
              {slot.size !== "Trá»‘ng" && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className="text-sm font-semibold text-white">{slot.size}</div>
            <div className="text-xs text-slate-500 mt-1">{slot.speed} Â· {slot.type}</div>
            {slot.total > 0 && (
              <div className="mt-2">
                <ThinBar value={slot.used} max={slot.total} color="#f59e0b" />
                <div className="text-xs text-slate-500 mt-1">{slot.used} / {slot.total} GB</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StorageCard() {
  const drives = [
    {
      id: "nvme0",
      name: "WD Black SN850X",
      interface: "NVMe PCIe 4.0 x4",
      capacity: 1000,
      used: 450,
      temp: 42,
      health: 98,
      readSpeed: 7000,
      writeSpeed: 6850,
      type: "NVMe SSD",
      color: "#8b5cf6",
    },
    {
      id: "sata0",
      name: "Samsung 870 EVO",
      interface: "SATA III 6Gb/s",
      capacity: 2000,
      used: 1240,
      temp: 36,
      health: 93,
      readSpeed: 560,
      writeSpeed: 530,
      type: "SATA SSD",
      color: "#06b6d4",
    },
    {
      id: "hdd0",
      name: "Seagate Barracuda",
      interface: "SATA III 6Gb/s",
      capacity: 4000,
      used: 2800,
      temp: 38,
      health: 87,
      readSpeed: 220,
      writeSpeed: 210,
      type: "HDD",
      color: "#64748b",
    },
  ];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
          <HardDrive className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">LÆ°u Trá»¯</h3>
          <p className="text-xs text-slate-400">3 á»• Ä‘Ä©a Â· Tá»•ng {(1 + 2 + 4)} TB</p>
        </div>
      </div>

      <div className="space-y-4">
        {drives.map(d => (
          <div key={d.id} className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
              <div>
                <div className="text-sm font-semibold text-white">{d.name}</div>
                <div className="text-xs text-slate-500">{d.interface} Â· {d.type}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${d.health >= 90 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : d.health >= 80 ? "text-amber-400 bg-amber-400/10 border-amber-400/20" : "text-rose-400 bg-rose-400/10 border-rose-400/20"}`}>
                  Sá»©c khá»e {d.health}%
                </span>
              </div>
            </div>

            {/* Usage bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{d.used} GB Ä‘Ã£ dÃ¹ng</span>
                <span>{d.capacity} GB</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(d.used / d.capacity) * 100}%`, background: d.color }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="text-slate-500 mb-0.5">Äá»c</div>
                <div className="text-white font-medium">{d.readSpeed >= 1000 ? `${(d.readSpeed/1000).toFixed(1)} GB/s` : `${d.readSpeed} MB/s`}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 mb-0.5">Ghi</div>
                <div className="text-white font-medium">{d.writeSpeed >= 1000 ? `${(d.writeSpeed/1000).toFixed(1)} GB/s` : `${d.writeSpeed} MB/s`}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 mb-0.5">Nhiá»‡t Ä‘á»™</div>
                <div className={`font-medium ${d.temp > 50 ? "text-rose-400" : d.temp > 42 ? "text-amber-400" : "text-emerald-400"}`}>{d.temp}Â°C</div>
              </div>
              <div className="text-center">
                <div className="text-slate-500 mb-0.5">CÃ²n trá»‘ng</div>
                <div className="text-white font-medium">{d.capacity - d.used} GB</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkCard() {
  const [download] = useLiveValues([245], 80);
  const [upload] = useLiveValues([48], 20);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
          <Wifi className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Máº¡ng</h3>
          <p className="text-xs text-slate-400">Intel I226-V Â· 2.5 GbE Â· Connected</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs text-emerald-400">Online</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-sky-400">
            <ArrowDown className="w-4 h-4" />
            <span className="text-xs font-medium text-slate-400">Download</span>
          </div>
          <div className="text-2xl font-bold text-white">{download} <span className="text-sm font-normal text-slate-400">Mbps</span></div>
          <ThinBar value={download} max={1000} color="#0ea5e9" />
        </div>
        <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <ArrowUp className="w-4 h-4" />
            <span className="text-xs font-medium text-slate-400">Upload</span>
          </div>
          <div className="text-2xl font-bold text-white">{upload} <span className="text-sm font-normal text-slate-400">Mbps</span></div>
          <ThinBar value={upload} max={1000} color="#10b981" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
        {[
          { label: "IP Ná»™i bá»™", value: "192.168.1.105" },
          { label: "Ping", value: "4 ms" },
          { label: "MAC", value: "A4:C3:F0:XX:XX:XX" },
        ].map(i => (
          <div key={i.label} className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-2.5">
            <div className="text-slate-500 mb-0.5">{i.label}</div>
            <div className="text-white font-medium truncate">{i.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Small arrow icons for network
function ArrowDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}
function ArrowUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

// ============================
//   Main Hardware Page
// ============================
export function HardwarePage() {
  const [tab, setTab] = useState<"cpu" | "gpu" | "ram" | "storage" | "network">("cpu");

  const tabs = [
    { key: "cpu", label: "CPU", icon: Cpu },
    { key: "gpu", label: "GPU", icon: Monitor },
    { key: "ram", label: "RAM", icon: Activity },
    { key: "storage", label: "LÆ°u Trá»¯", icon: HardDrive },
    { key: "network", label: "Máº¡ng", icon: Wifi },
  ] as const;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Pháº§n Cá»©ng</h2>
        <p className="text-sm text-slate-400 mt-1">ThÃ´ng sá»‘ chi tiáº¿t cÃ¡c linh kiá»‡n theo thá»i gian thá»±c</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "CPU", value: "35%", sub: "62Â°C", color: "text-blue-400" },
          { label: "GPU", value: "68%", sub: "70Â°C", color: "text-emerald-400" },
          { label: "RAM", value: "18.5/32 GB", sub: "58%", color: "text-amber-400" },
          { label: "NVMe", value: "450/1000 GB", sub: "42Â°C", color: "text-purple-400" },
          { label: "Máº¡ng", value: "â†“245 Mbps", sub: "â†‘48 Mbps", color: "text-cyan-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                active
                  ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-600 bg-slate-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "cpu" && <CpuCard />}
      {tab === "gpu" && <GpuCard />}
      {tab === "ram" && <RamCard />}
      {tab === "storage" && <StorageCard />}
      {tab === "network" && <NetworkCard />}
    </div>
  );
}



