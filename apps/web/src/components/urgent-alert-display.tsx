import { useEffect } from "react";
import { alertEffectClass, type AlertSettings } from "@/lib/urgent-alert";

type UrgentAlertDisplayProps = {
  message: string;
  settings: AlertSettings;
  onDismiss: () => void;
};

export function UrgentAlertDisplay({ message, settings, onDismiss }: UrgentAlertDisplayProps) {
  useEffect(() => {
    if (!message) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      window.dispatchEvent(new Event("universum:dismiss-urgent-alert"));
      onDismiss();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [message, onDismiss]);

  if (!message) return null;
  const effect = alertEffectClass(settings.visualEffect);

  if (settings.layout === "alert3") {
    return (
      <div role="alert" className={`fixed inset-0 z-[100] flex items-center justify-center bg-red-600 p-10 ${effect}`}>
        <div className="max-w-7xl text-center text-5xl font-black uppercase leading-tight text-white drop-shadow-2xl md:text-7xl">{message}</div>
      </div>
    );
  }

  if (settings.layout === "alert2") {
    return (
      <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6">
        <div role="alert" className={`w-[92vw] max-w-6xl rounded-2xl border-4 border-red-300 bg-red-600 p-10 text-center text-4xl font-black uppercase leading-tight text-white shadow-2xl shadow-red-500/50 md:p-14 md:text-6xl ${effect}`}>{message}</div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-start justify-center p-6 md:p-10">
      <div role="alert" className={`${effect} w-full max-w-5xl rounded-xl border-4 border-red-300 bg-red-600 p-6 text-center text-2xl font-black uppercase text-white shadow-2xl shadow-red-500/40`}>{message}</div>
    </div>
  );
}
