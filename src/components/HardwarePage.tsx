"use client";

export function HardwarePage() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm text-slate-200">
      <h2 className="text-xl font-semibold mb-2">Phần cứng</h2>
      <p className="text-slate-400">Trang này đang được tối ưu lại để tránh lỗi font/encoding.</p>
      <ul className="mt-4 list-disc pl-5 space-y-1 text-slate-300">
        <li>CPU: Theo dõi nhiệt độ, load, fan</li>
        <li>GPU: Theo dõi load, VRAM, fan</li>
        <li>RAM / Disk: Theo dõi dung lượng và tốc độ</li>
      </ul>
    </div>
  );
}
