let combo = 0;
let baseDamage = 5;
let baseMultiplier = 0.8;
let perfectStreak = 0;
let feverActive = false;
let feverCooldown = false;
let feverTimer = null;
let feverCooldownTimer = null;
let barrierCharges = 0;
let runUpgrades = [];
let bonusMultipliers = {
    attackUp: 0,
    criticalRate: 0,
    comboMultiplierUp: 0,
    targetSizeUp: 0,
    spawnTimeUp: 0,
    scoreUp: 0,
    comboSafe: 0,
    chain: 0,
    lucky: 0,
    finisher: 0,
    doubleStrike: 0,
    absorb: 0,
    echo: 0,
    barrier: 0,
    aura: 0
};

function initCombo() {
    combo = 0;
    perfectStreak = 0;
    updateStreakDisplay();
    feverActive = false;
    feverCooldown = false;
    barrierCharges = 0;
    runUpgrades = [];
    if (feverTimer) { clearTimeout(feverTimer); feverTimer = null; }
    if (feverCooldownTimer) { clearTimeout(feverCooldownTimer); feverCooldownTimer = null; }
    window.feverEndTime = 0;
    window.feverCooldownEnd = 0;
    window.feverSavedRemaining = 0;
    window.cooldownSavedRemaining = 0;
    document.getElementById('fever-timer').classList.add('hidden');
    document.getElementById('fever-overlay').classList.remove('active');
    bonusMultipliers = {
        attackUp: 0, criticalRate: 0, comboMultiplierUp: 0,
        targetSizeUp: 0, spawnTimeUp: 0, scoreUp: 0,
        comboSafe: 0, chain: 0, lucky: 0, finisher: 0,
        doubleStrike: 0, absorb: 0, echo: 0, barrier: 0, aura: 0
    };
}

function addCombo() { combo++; showComboPopup(); }

function resetCombo() {
    combo = 0;
    perfectStreak = 0;
}

function getCombo() { return combo; }
function setCombo(n) { combo = n; }

function getMultiplier() {
    const base = baseMultiplier + bonusMultipliers.comboMultiplierUp;
    const comboMult = 1 + (combo * base);
    const attackMult = 1 + bonusMultipliers.attackUp;
    let mult = comboMult * attackMult;
    if (bonusMultipliers.aura > 0 && combo >= 10) {
        mult += Math.floor(combo / 10) * bonusMultipliers.aura;
    }
    return mult;
}

function getBaseDamage() { return baseDamage; }
function setBaseDamage(d) { baseDamage = d; }
function addAttackUp(a) { bonusMultipliers.attackUp += a; }
function addComboMultiplierUp(a) { bonusMultipliers.comboMultiplierUp += a; }
function getComboMultiplierUp() { return bonusMultipliers.comboMultiplierUp; }
function addCriticalRate(r) { bonusMultipliers.criticalRate += r; }
function addScoreUp(a) { bonusMultipliers.scoreUp += a; }
function isComboSafe() { return bonusMultipliers.comboSafe > 0; }
function getComboSafeReduction() { return bonusMultipliers.comboSafe * 3; }
function getLuckyChance() { return bonusMultipliers.lucky; }
function getFinisherBonus() { return bonusMultipliers.finisher; }
function getCriticalRate() { return bonusMultipliers.criticalRate; }
function getScoreMultiplier() { return 1 + bonusMultipliers.scoreUp; }
function getAbsorbBonus() { return bonusMultipliers.absorb; }
function getTargetSizeBonus() { return bonusMultipliers.targetSizeUp; }
function getSpawnTimeBonus() { return bonusMultipliers.spawnTimeUp; }
function getEchoRate() { return bonusMultipliers.echo; }
function getBarrierCharges() { return barrierCharges; }
function consumeBarrier() { if (barrierCharges > 0) { barrierCharges--; return true; } return false; }
function checkLucky() {
    return bonusMultipliers.lucky > 0 && Math.random() < bonusMultipliers.lucky;
}

function getChainBonus() {
    if (bonusMultipliers.chain > 0 && combo % 5 === 0) return bonusMultipliers.chain;
    return 0;
}
function getChainAmount() { return bonusMultipliers.chain; }

function isEcho() {
    return bonusMultipliers.echo > 0 && Math.random() < bonusMultipliers.echo;
}

function getDoubleStrikeMultiplier() {
    const rate = bonusMultipliers.doubleStrike;
    if (rate <= 0) return 1;
    let mult = 1, remaining = rate;
    while (remaining > 0) {
        if (Math.random() < Math.min(1, remaining)) mult *= 2;
        remaining -= 1;
    }
    return mult;
}

function getStreakMultiplier(streak) {
    if (streak < 3) return 0;
    const milestones = [
        { at: 3, m: 0.5 }, { at: 5, m: 1.0 }, { at: 10, m: 1.5 },
        { at: 20, m: 2.0 }, { at: 30, m: 2.5 }, { at: 50, m: 3.0 },
        { at: 75, m: 3.5 }, { at: 100, m: 3.75 }
    ];
    for (const m of milestones) {
        if (streak === m.at) return m.m;
    }
    if (streak >= 100 && (streak - 100) % 25 === 0) {
        const steps = (streak - 100) / 25;
        return Math.min(10.0, 3.75 + steps * 0.25);
    }
    return 0;
}

function addPerfectStreak() {
    perfectStreak++;
    updateStreakDisplay();
    const mult = getStreakMultiplier(perfectStreak);
    const textMap = {
        3: '3連続! +50%', 5: '5連続! +100%', 10: '10連続! +150%',
        20: '20連続! +200%', 30: '30連続! +250%', 50: '50連続! +300%',
        75: '75連続! +350%', 100: '100連続! +400%'
    };
    const milestoneText = textMap[perfectStreak];
    if (perfectStreak >= 100 && (perfectStreak - 100) % 25 === 0) {
        const pct = Math.round(getStreakMultiplier(perfectStreak) * 100);
        showStreakText(`${perfectStreak}連続! +${pct}%`, 'done');
    } else if (milestoneText) {
        showStreakText(milestoneText, 'done');
    } else if (perfectStreak === 2) {
        showStreakText('あと1!', 'near');
    }
    return mult;
}

function resetPerfectStreak() { perfectStreak = 0; updateStreakDisplay(); }
function getPerfectStreak() { return perfectStreak; }

function showStreakText(msg, cls) {
    const el = document.createElement('div');
    el.className = 'streak-text ' + cls;
    el.textContent = msg;
    el.style.left = '50%';
    el.style.top = '40%';
    el.style.transform = 'translateX(-50%)';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
}

function isFever() { return feverActive; }

function canStartFever() {
    return combo >= 15 && !feverActive && !feverCooldown;
}

function activateFever() {
    if (feverActive) return;
    feverActive = true;
    feverCooldown = true;
    window.feverEndTime = Date.now() + 30000;
    document.getElementById('fever-overlay').classList.add('active');
    const text = document.getElementById('fever-text');
    text.classList.remove('show');
    void text.offsetWidth;
    text.textContent = 'FEVER!';
    text.classList.add('show');
    feverTimer = setTimeout(() => deactivateFever(), 30000);
}

function deactivateFever() {
    feverActive = false;
    window.feverEndTime = 0;
    window.feverCooldownEnd = Date.now() + 60000;
    document.getElementById('fever-overlay').classList.remove('active');
    document.getElementById('fever-timer').classList.add('hidden');
    if (feverTimer) { clearTimeout(feverTimer); feverTimer = null; }
    feverCooldownTimer = setTimeout(() => { feverCooldown = false; }, 60000);
}

function pauseFeverSystem() {
    if (feverTimer) { clearTimeout(feverTimer); feverTimer = null; }
    if (feverActive) {
        window.feverSavedRemaining = Math.max(0, window.feverEndTime - Date.now());
    }
    if (feverCooldownTimer) { clearTimeout(feverCooldownTimer); feverCooldownTimer = null; }
    if (feverCooldown && !feverActive) {
        window.cooldownSavedRemaining = Math.max(0, window.feverCooldownEnd - Date.now());
    }
}

function resumeFeverSystem() {
    if (window.feverSavedRemaining > 0) {
        window.feverEndTime = Date.now() + window.feverSavedRemaining;
        feverTimer = setTimeout(() => deactivateFever(), window.feverSavedRemaining);
        window.feverSavedRemaining = 0;
    }
    if (window.cooldownSavedRemaining > 0) {
        window.feverCooldownEnd = Date.now() + window.cooldownSavedRemaining;
        feverCooldownTimer = setTimeout(() => { feverCooldown = false; }, window.cooldownSavedRemaining);
        window.cooldownSavedRemaining = 0;
    }
}

function showComboPopup() {
    if (combo <= 1) return;
    const milestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
    if (!milestones.includes(combo)) return;
    const popup = document.createElement('div');
    popup.className = 'combo-popup' + (combo >= 50 ? ' big' : '');
    const emoji = combo >= 50 ? '🔥 ' : '';
    popup.textContent = `${emoji}${combo} COMBO!`;
    const enemyArea = document.getElementById('enemy-area');
    const rect = enemyArea.getBoundingClientRect();
    popup.style.left = `${rect.width / 2}px`;
    popup.style.top = `${rect.height / 2 - 60}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 700);
}

function getActiveUpgrades() {
    const b = bonusMultipliers;
    const list = [];
    function isMax(id) {
        if (id === 3) return b.comboMultiplierUp > 0;
        if (id === 4) return b.targetSizeUp >= 0.30;
        if (id === 5) return b.spawnTimeUp >= 0.40;
        if (id === 8) return b.chain > 0;
        if (id === 9) return b.lucky > 0;
        if (id === 12) return b.absorb > 0;
        if (id === 13) return b.echo >= 0.30;
        return false;
    }
    if (b.attackUp > 0) list.push(`攻撃力UP +${Math.round(b.attackUp * 100)}%`);
    if (b.criticalRate > 0) list.push(`クリティカル ${Math.round(b.criticalRate * 100)}%×3`);
    if (b.comboMultiplierUp > 0) list.push(`コンボ倍率UP (base+${b.comboMultiplierUp.toFixed(1)})${isMax(3) ? ' (max)' : ''}`);
    if (b.targetSizeUp > 0) list.push(`ターゲット拡大 +${Math.round(b.targetSizeUp * 100)}%${isMax(4) ? ' (max)' : ''}`);
    if (b.spawnTimeUp > 0) list.push(`余裕UP +${Math.round(b.spawnTimeUp * 100)}%${isMax(5) ? ' (max)' : ''}`);
    if (b.scoreUp > 0) list.push(`スコアブースト +${Math.round(b.scoreUp * 100)}%`);
    if (b.comboSafe > 0) list.push(`コンボセーフ 残${b.comboSafe * 3}`);
    if (b.chain > 0) list.push(`チェイン +${b.chain}${isMax(8) ? ' (max)' : ''}`);
    if (b.lucky > 0) list.push(`ラッキー ${Math.round(b.lucky * 100)}%追加ダメ${isMax(9) ? ' (max)' : ''}`);
    if (b.finisher > 0) list.push(`フィニッシャー x${b.finisher}`);
    if (b.doubleStrike > 0) list.push(`連撃 ${Math.round(b.doubleStrike * 100)}%×2`);
    if (b.absorb > 0) list.push(`吸収 +${b.absorb}${isMax(12) ? ' (max)' : ''}`);
    if (b.echo > 0) list.push(`エコー ${Math.round(b.echo * 100)}%×1.0${isMax(13) ? ' (max)' : ''}`);
    if (b.barrier > 0) list.push(`障壁 x${b.barrier} (残${barrierCharges})`);
    if (b.aura > 0) {
        const stacks = Math.round(b.aura / 1.5);
        const currentBonus = getCombo() >= 10 ? Math.floor(getCombo() / 10) * b.aura : 0;
        list.push(`オーラ x${stacks} (+${b.aura.toFixed(1)}/10Combo, 現在+${currentBonus.toFixed(1)})`);
    }
    return list;
}

function applyUpgrade(upgradeId, mult) {
    mult = mult || 1;
    const names = { 1:'攻撃力UP', 2:'クリティカル', 3:'コンボ倍率UP', 4:'ターゲット拡大', 5:'余裕UP', 6:'スコアブースト', 7:'コンボセーフ', 8:'チェイン', 9:'ラッキー', 10:'フィニッシャー', 11:'連撃', 12:'吸収', 13:'エコー', 14:'障壁', 15:'オーラ' };
    runUpgrades.push(names[upgradeId] || '強化' + upgradeId);
    switch(upgradeId) {
        case 1: addAttackUp(0.25 * mult); break;
        case 2: addCriticalRate(0.1 * mult); break;
        case 3: addComboMultiplierUp(0.1 * mult); break;
        case 4:
            if (bonusMultipliers.targetSizeUp >= 0.30) break;
            bonusMultipliers.targetSizeUp += 0.15 * mult;
            break;
        case 5:
            if (bonusMultipliers.spawnTimeUp >= 0.40) break;
            bonusMultipliers.spawnTimeUp += 0.2 * mult;
            break;
        case 6: addScoreUp(0.3 * mult); break;
        case 7: bonusMultipliers.comboSafe += Math.round(1 * mult); break;
        case 8:
            if (bonusMultipliers.chain > 0) break;
            bonusMultipliers.chain += 250 * mult;
            break;
        case 9:
            if (bonusMultipliers.lucky > 0) break;
            bonusMultipliers.lucky += 0.10 * mult;
            break;
        case 10: bonusMultipliers.finisher += Math.round(1 * mult); break;
        case 11: bonusMultipliers.doubleStrike += 0.15 * mult; break;
        case 12:
            if (bonusMultipliers.absorb > 0) break;
            bonusMultipliers.absorb += 200 * mult;
            break;
        case 13:
            if (bonusMultipliers.echo >= 0.30) break;
            bonusMultipliers.echo += 0.15 * mult;
            break;
        case 14: bonusMultipliers.barrier += Math.round(1 * mult); barrierCharges += Math.round(1 * mult); break;
        case 15: bonusMultipliers.aura += 1.5 * mult; break;
    }
}

function getRunUpgrades() { return runUpgrades; }

function updateStreakDisplay() {
    const el = document.getElementById('streak-value');
    if (!el) return;
    el.textContent = perfectStreak + ' Streak';
    el.style.color = '#ff6b6b';
}