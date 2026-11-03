export type AlertVisualEffect = "pulse" | "flash" | "steady";
export type AlertLayout = "alert1" | "alert2" | "alert3";
export type AlertSettings = {
  enabled: boolean;
  duration: number;
  visualEffect: AlertVisualEffect;
  layout: AlertLayout;
  repeatCount: number;
  repeatIntervalMinutes: number;
};

export const getAlertSettings = (): AlertSettings => {
  try {
    const saved = JSON.parse(localStorage.getItem("hub.alertSettings") ?? "{}") as Partial<AlertSettings>;
    return {
      enabled: saved.enabled ?? true,
      duration: Math.min(30, Math.max(2, saved.duration ?? 6)),
      visualEffect: saved.visualEffect ?? "pulse",
      layout: saved.layout ?? "alert1",
      repeatCount: Math.min(10, Math.max(1, saved.repeatCount ?? 1)),
      repeatIntervalMinutes: Math.min(1440, Math.max(1, saved.repeatIntervalMinutes ?? 5)),
    };
  } catch {
    return { enabled: true, duration: 6, visualEffect: "pulse", layout: "alert1", repeatCount: 1, repeatIntervalMinutes: 5 };
  }
};

export const alertEffectClass = (effect: AlertVisualEffect) => effect === "pulse" ? "animate-pulse" : effect === "flash" ? "urgent-alert-flash" : "";

const openAlertDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open("universum-alerts", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("sounds");
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export async function saveAlertSound(file: File) {
  const db = await openAlertDb();
  await new Promise<void>((resolve, reject) => { const transaction = db.transaction("sounds", "readwrite"); transaction.objectStore("sounds").put(file, "custom"); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
  db.close(); localStorage.setItem("hub.alertSoundName", file.name); localStorage.removeItem("hub.alertSound");
}

export async function removeAlertSound() {
  const db = await openAlertDb();
  await new Promise<void>((resolve, reject) => { const transaction = db.transaction("sounds", "readwrite"); transaction.objectStore("sounds").delete("custom"); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
  db.close(); localStorage.removeItem("hub.alertSoundName"); localStorage.removeItem("hub.alertSound");
}

async function customAlertSoundUrl() {
  const db = await openAlertDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => { const request = db.transaction("sounds").objectStore("sounds").get("custom"); request.onsuccess = () => resolve(request.result as Blob | undefined); request.onerror = () => reject(request.error); });
  db.close(); return blob ? URL.createObjectURL(blob) : localStorage.getItem("hub.alertSound");
}

export async function emitUrgentClientAlert(client: { name: string; priorityLevel?: string }, showVisual: (message: string) => void) {
  if (!client.priorityLevel || client.priorityLevel === "normal") return false;
  const { duration } = getAlertSettings();
  showVisual(`ATENDIMENTO PRIORITÁRIO: ${client.name}`);
  try {
    const customSound = await customAlertSoundUrl();
    if (customSound) {
      const audio = new Audio(customSound); audio.loop = true; await audio.play();
      const stop = () => { audio.pause(); audio.currentTime = 0; if (customSound.startsWith("blob:")) URL.revokeObjectURL(customSound); };
      window.addEventListener("universum:dismiss-urgent-alert", stop, { once: true });
      window.setTimeout(() => { window.removeEventListener("universum:dismiss-urgent-alert", stop); stop(); }, duration * 1000);
    } else {
      const context = new AudioContext(); await context.resume();
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = "square"; oscillator.frequency.value = 880; gain.gain.value = 0.12;
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start();
      let stopped = false;
      const stop = () => { if (stopped) return; stopped = true; oscillator.stop(); void context.close(); };
      window.addEventListener("universum:dismiss-urgent-alert", stop, { once: true });
      window.setTimeout(() => { window.removeEventListener("universum:dismiss-urgent-alert", stop); stop(); }, duration * 1000);
    }
    return true;
  } catch {
    showVisual(`ATENDIMENTO PRIORITÁRIO: ${client.name}. Clique em “Testar som” para liberar o áudio.`);
    return false;
  }
}
