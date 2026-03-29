// @ts-nocheck
"use client";

export function PowerPage() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm text-slate-200">
      <h2 className="text-xl font-semibold mb-2">Dien nang</h2>
      <p className="text-slate-400">Trang nay dang duoc toi uu lai de tranh loi font/encoding.</p>
      <ul className="mt-4 list-disc pl-5 space-y-1 text-slate-300">
        <li>Cong suat hien tai (W)</li>
        <li>kWh tu luc boot</li>
        <li>Uoc tinh chi phi theo gia dien</li>
      </ul>
    </div>
  );
}
