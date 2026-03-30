"use client";

export function PowerPage() {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm text-slate-200">
      <h2 className="text-xl font-semibold mb-2">Điện năng</h2>
      <p className="text-slate-400">Trang này đang được tối ưu lại để tránh lỗi font/encoding.</p>
      <ul className="mt-4 list-disc pl-5 space-y-1 text-slate-300">
        <li>Công suất hiện tại (W)</li>
        <li>kWh từ lúc khởi động</li>
        <li>Ước tính chi phí theo giá điện</li>
      </ul>
    </div>
  );
}
