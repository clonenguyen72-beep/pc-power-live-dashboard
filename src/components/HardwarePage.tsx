// @ts-nocheck
"use client";

export function HardwarePage() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm text-slate-200">
      <h2 className="text-xl font-semibold mb-2">Phan cung</h2>
      <p className="text-slate-400">Trang nay dang duoc toi uu lai de tranh loi font/encoding.</p>
      <ul className="mt-4 list-disc pl-5 space-y-1 text-slate-300">
        <li>CPU: Theo doi nhiet do, load, fan</li>
        <li>GPU: Theo doi load, VRAM, fan</li>
        <li>RAM / Disk: Theo doi dung luong va toc do</li>
      </ul>
    </div>
  );
}
