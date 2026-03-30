"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <h1 className="text-xl font-semibold text-white mb-2">Đã xảy ra lỗi</h1>
        <p className="text-sm text-slate-400 mb-4">
          Ứng dụng vẫn có thể hoạt động ở phần khác. Bạn có thể thử tải lại trang.
        </p>
        <div className="text-sm text-rose-200 mb-4 break-words">
          Chi tiết: {error?.message || "Lỗi không xác định"}
        </div>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

