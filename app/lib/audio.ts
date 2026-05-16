// Shared audio for the chat — Web Audio API (procedural, kein Asset).
//
// Wichtig: EIN einziger AudioContext für die ganze Session. iOS Safari hält
// neue Contexts im 'suspended'-State, bis ein User-Gesture sie freischaltet.
// unlockAudio() ruft resume() — muss beim ersten Touch/Click in der App
// passieren (siehe AppShell). Danach kann playSwoosh() auch aus async Events
// (z.B. Realtime-WebSocket) abgespielt werden.

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    try {
      sharedCtx = new Ctx();
    } catch {
      return null;
    }
  }
  return sharedCtx;
}

// Beim ersten User-Gesture aufrufen — entsperrt den AudioContext für den
// Rest der Session. No-op wenn schon entsperrt.
export function unlockAudio(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => { /* ignore */ });
  }
}

// Descending sweep 900 Hz → 220 Hz über 160 ms — der iMessage-"swoosh".
// Identischer Sound für Send + Receive.
export function playSwoosh(): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      // Best-effort: falls noch nicht entsperrt, jetzt versuchen. Wenn das
      // ohne User-Gesture fehlschlägt (iOS), bleibt der Sound stumm — kein
      // Crash, normaler Fallback.
      void ctx.resume().catch(() => { /* ignore */ });
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.16);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.start(t);
    osc.stop(t + 0.16);
    // Kein ctx.close() mehr — Singleton bleibt für die Session offen.
  } catch {
    // fail silently
  }
}
