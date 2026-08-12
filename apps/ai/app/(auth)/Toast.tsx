"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";

type Props = {
  message: string;
  type: ToastType;
  onDismiss?: () => void;
  autoDismissMs?: number;
};

export function Toast({ message, type, onDismiss, autoDismissMs = 5000 }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoDismissMs) return;
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  const styles =
    type === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : "border-red-500/40 bg-red-500/10 text-red-300";

  const Icon = type === "success" ? CheckCircle2 : XCircle;
  const iconColor = type === "success" ? "text-emerald-400" : "text-red-400";
  const title = type === "success" ? "Success" : "Sign-in failed";

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={
        "pointer-events-auto fixed right-6 top-6 z-[100] w-[calc(100%-3rem)] max-w-sm rounded-xl border p-4 shadow-2xl backdrop-blur transition-all duration-300 " +
        (visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0") +
        " " +
        styles
      }
    >
      <div className="flex items-start gap-3">
        <Icon className={"h-5 w-5 shrink-0 " + iconColor} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-xs opacity-90">{message}</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="ml-2 rounded-md p-1 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
