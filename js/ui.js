let logCount = 0;
const MAX_LOG_ENTRIES = 12;
let prevCombo = 0;
let displayScore = 0;
let scoreAnimId = null;

function initUI() {
    displayScore = getScore();
    updateInfoBar();
    clearLog();
    clearText();
}

function updateInfoBar() {
    updateCombatInfo();
}

function animateScore() {
    var target = getScore();
    if (displayScore === target) { scoreAnimId = null; return; }
    var diff = target - displayScore;
    if (Math.abs(diff) <= 1) {
        displayScore = target;
    } else {
        displayScore += Math.ceil(diff * 0.25);
        if ((diff > 0 && displayScore > target) || (diff < 0 && displayScore < target)) {
            displayScore = target;
        }
    }
    document.getElementById('score-display').textContent = Math.round(displayScore).toLocaleString();
    if (displayScore !== target) {
        scoreAnimId = requestAnimationFrame(animateScore);
    }
}

function updateCombatInfo() {
    var target = getScore();
    if (displayScore !== target && !scoreAnimId) {
        scoreAnimId = requestAnimationFrame(animateScore);
    }
    var combo = getCombo();
    var comboEl = document.getElementById('combo-number');
    comboEl.textContent = combo;
    if (combo > prevCombo && combo > 1) {
        comboEl.classList.remove('combo-pop');
        void comboEl.offsetWidth;
        comboEl.classList.add('combo-pop');
    }
    prevCombo = combo;
    document.getElementById('multiplier-display').textContent = 'x' + getMultiplier().toFixed(1);
}

function addLog(message) {
    const log = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    if (log.style.fontSize) entry.style.fontSize = log.style.fontSize;
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