let audioCtx = null;
let unlocked = false;

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx =
      window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended' && !unlocked) {
    audioCtx.resume();
  }
  unlocked = true;
  return audioCtx;
}

function playTone(frequency, duration, gainValue) {
  const ctx = ensureContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.value = gainValue;

  osc.connect(gain).connect(ctx.destination);

  const now = ctx.currentTime;
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.start(now);
  osc.stop(now + duration);
}

export function playInteractionSound(success = true) {
  if (success) {
    playTone(660, 0.15, 0.18);
  } else {
    playTone(220, 0.2, 0.22);
  }
}

export function playErrorSound() {
  playInteractionSound(false);
}

export function playTileChangeSound() {
  playTone(420, 0.12, 0.2);
}

export function playPlantSound() {
  playTone(540, 0.18, 0.18);
}

export function playHarvestSound() {
  playTone(360, 0.22, 0.22);
}
