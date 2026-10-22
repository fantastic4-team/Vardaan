// A soft two-tone ringtone generated with the Web Audio API, so there is no audio file to ship.
// Returns a stop function.
export function startRingtone() {
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return () => {};
  const ctx = new AudioCtx();
  let stopped = false;

  const ring = () => {
    if (stopped) return;
    const t = ctx.currentTime;
    [0, 0.42].forEach((offset) => {
      [659.25, 830.61].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t + offset);
        gain.gain.linearRampToValueAtTime(0.08, t + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.36);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t + offset);
        osc.stop(t + offset + 0.4);
      });
    });
  };

  ring();
  const timer = setInterval(ring, 2200);
  return () => {
    stopped = true;
    clearInterval(timer);
    ctx.close().catch(() => {});
  };
}
