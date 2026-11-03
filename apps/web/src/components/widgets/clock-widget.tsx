import { useEffect, useState } from "react";

export function ClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <span className="text-3xl font-mono font-semibold text-white">
        {now.toLocaleTimeString("pt-BR")}
      </span>
      <span className="mt-1 text-xs text-slate-500 capitalize">
        {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
      </span>
    </div>
  );
}
