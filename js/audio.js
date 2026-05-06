let audioCtx = null;
let masterGain = null;

function initAudio() {
    if (audioCtx) audioCtx.close();
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    const saved = parseFloat(localStorage.getItem('comboBattlerVolume') || '1');
    masterGain.gain.value = Math.max(0, Math.min(1, saved));
}

function setVolume(val) {
    const v = Math.max(0, Math.min(1, parseFloat(val)));
    if (masterGain) masterGain.gain.value = v;
    try { localStorage.setItem('comboBattlerVolume', String(v)); } catch(e) {}
}

function getVolume() {
    return masterGain ? masterGain.gain.value : 1;
}

function playTone(freq, endFreq, type, duration, volume, delay) {
    if (!audioCtx || !masterGain) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = (delay || 0) + audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq != null) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
}

function playHitSound() { playTone(600, 200, 'sine', 0.1, 0.15); }
function playGoodSound() { playTone(500, 400, 'sine', 0.08, 0.1); }
function playOkSound() { playTone(400, 300, 'sine', 0.08, 0.08); }
function playMissSound() { playTone(150, 80, 'sawtooth', 0.2, 0.1); }
function playComboSound() { playTone(800, 1200, 'sine', 0.15, 0.12); }
function playPerfectSound() { playTone(1000, 1500, 'sine', 0.12, 0.15); }
function playPhaseClearSound() {
    [0, 0.1, 0.2].forEach((delay, i) => playTone(500 + i * 200, null, 'sine', 0.2, 0.1, delay));
}
function playGameStartSound() {
    playTone(500, 700, 'sine', 0.15, 0.12);
    setTimeout(() => playTone(700, 900, 'sine', 0.15, 0.12), 120);
    setTimeout(() => playTone(900, 1100, 'sine', 0.2, 0.15), 240);
}
function playSelectSound() {
    playTone(500, 700, 'triangle', 0.06, 0.12);
    setTimeout(() => playTone(900, 1100, 'triangle', 0.06, 0.12), 70);
    setTimeout(() => playTone(1200, 800, 'sine', 0.12, 0.2), 140);
}
function playOpenSound() { playTone(500, 800, 'sine', 0.1, 0.07); }
function playCloseSound() { playTone(700, 500, 'sine', 0.08, 0.06); }
function playConfirmSound() { 
    playTone(600, null, 'sine', 0.06, 0.06);
    setTimeout(() => playTone(800, null, 'sine', 0.06, 0.06), 60);
}
function playCancelSound() { playTone(400, 300, 'sine', 0.06, 0.05); }
function playWarningSound() { playTone(200, 100, 'sawtooth', 0.2, 0.1); }
function playGameClearSound() {
    [0, 0.12, 0.24, 0.36].forEach((delay, i) => playTone(600 + i * 200, null, 'sine', 0.25, 0.12, delay));
    setTimeout(() => playTone(1400, 1800, 'sine', 0.3, 0.18), 480);
}
function playRetireSound() {
    [0, 0.15, 0.3].forEach((delay, i) => playTone(400 - i * 100, 150, 'sine', 0.25, 0.08, delay));
}
function playMilestone10Sound() {
    playTone(600, 1000, 'triangle', 0.12, 0.1);
    setTimeout(() => playTone(1000, 1400, 'triangle', 0.12, 0.1), 80);
}
function playMilestone50Sound() {
    playTone(150, 60, 'sawtooth', 0.3, 0.15);
    setTimeout(() => playTone(300, 100, 'sawtooth', 0.25, 0.12), 100);
}
function playTargetPopSound() { playTone(900, 500, 'sine', 0.06, 0.06); }
function playPurplePopSound() { playTone(1000, 600, 'sine', 0.07, 0.07); }
function playGoldPopSound() { playTone(1100, 700, 'triangle', 0.08, 0.08); }
function playRedPopSound() { playTone(800, 1200, 'sine', 0.1, 0.1); }
function playChoicesAppearSound() {
    playTone(400, 600, 'sine', 0.1, 0.08);
    setTimeout(() => playTone(600, 800, 'sine', 0.1, 0.08), 100);
    setTimeout(() => playTone(800, 1000, 'sine', 0.12, 0.1), 200);
}
function playFeverSound() {
    [0, 0.08, 0.16, 0.24, 0.32].forEach((delay, i) => playTone(300 + i * 200, 500 + i * 200, 'sine', 0.1, 0.1, delay));
    setTimeout(() => playTone(1300, 1800, 'sine', 0.3, 0.2), 400);
}

function resumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}