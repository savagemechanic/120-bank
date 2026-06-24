"use client";

import { CheckCircle2, XCircle } from "lucide-react";

export interface ToastState {
  type: "success" | "error";
  message: string;
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) {
    return null;
  }

  const Icon = toast.type === "success" ? CheckCircle2 : XCircle;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-panel">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${toast.type === "success" ? "text-emerald-700" : "text-rose-700"}`}
          aria-hidden="true"
        />
        {toast.message}
      </div>
    </div>
  );
}
