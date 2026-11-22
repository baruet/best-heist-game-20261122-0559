// The Gilded Hour — sound, synthesized live with WebAudio.
// One job: every beep, chime and siren in the game, no audio files.
// Nothing plays until the player presses a key or clicks (browser rule),
// so the audio context is created lazily on the first gesture.
let ctx = null;
let muted = false;
let alarmNodes = null;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopAlarmLoop();
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playPickup() {
  tone(880, 0.12, 'sine', 0.18);
  tone(1318, 0.16, 'sine', 0.14, 0.07);
}

export function playThrow() {
  tone(420, 0.18, 'triangle', 0.12, 0, 180);
}

export function playSmoke() {
  tone(300, 0.35, 'sine', 0.1, 0, 90);
}

export function playSpotted() {
  tone(660, 0.14, 'square', 0.12);
  tone(660, 0.14, 'square', 0.12, 0.18);
}

export function playCaught() {
  tone(220, 0.5, 'sawtooth', 0.16, 0, 55);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', 0.16, i * 0.11));
}

export function playClick() {
  tone(1200, 0.05, 'sine', 0.08);
}

export function startAlarmLoop() {
  if (!ctx || muted || alarmNodes) return;
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 440;
  lfo.type = 'sine';
  lfo.frequency.value = 2.2;
  lfoGain.gain.value = 120;
  gain.gain.value = 0.045;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  lfo.start();
  alarmNodes = { osc, lfo, gain };
}

export function stopAlarmLoop() {
  if (!alarmNodes) return;
  try {
    alarmNodes.osc.stop();
    alarmNodes.lfo.stop();
  } catch {
    // Already stopped.
  }
  alarmNodes = null;
}
