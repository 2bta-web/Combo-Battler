let logCount = 0;
const MAX_LOG_ENTRIES = 12;
let prevCombo = 0;

function initUI() {
    updateInfoBar();
    clearLog();
    clearText();
}

function updateInfoBar() {
    document.getElementById('phase-display').textContent = `${getPhase()} / ${getPhaseCount()}`;
    updateCombatInfo();
}

function updateCombatInfo() {
    document.getElementById('score-display').textContent = getScore().toLocaleString();
    const combo = getCombo();
    const comboEl = document.getElementById('combo-number');
    comboEl.textContent = combo;
    if (combo > prevCombo && combo > 1) {
        comboEl.classList.remove('combo-pop');
        void comboEl.offsetWidth;
        comboEl.classList.add('combo-pop');
    }
    prevCombo = combo;
    document.getElementById('multiplier-display').textContent = `x${getMultiplier().toFixed(1)}`;
}

function addLog(message) {
    const log = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    log.appendChild(entry);
    logCount++;
    while (logCount > MAX_LOG_ENTRIES) {
        log.removeChild(log.firstChild);
        logCount--;
    }
    setTimeout(() => { entry.style.opacity = '0.7'; }, 2000);
}

function clearLog() {
    document.getElementById('log').innerHTML = '';
    logCount = 0;
}

function showText(text) {
    document.getElementById('text-content').textContent = text;
}

function clearText() {
    document.getElementById('text-content').textContent = '';
}