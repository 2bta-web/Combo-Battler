let gameState = 'start';
let gameLoopId = null;
let targetSpawnTimer = null;
let stats = { perfect: 0, good: 0, ok: 0, early: 0, miss: 0, totalHits: 0, maxCombo: 0, blue: 0, purple: 0, gold: 0, red: 0, maxStreak: 0 };
let scoreBreakdown = { base: 0, crit: 0, doubleStrike: 0, echo: 0, lucky: 0, damage: 0, feverBonus: 0, chain: 0, absorb: 0, finisher: 0, streak: 0 };
let startTime = 0;

const START_SCREEN = document.getElementById('start-screen');
const RESULT_SCREEN = document.getElementById('result-screen');

let confirmCallback = null;

document.getElementById('pause-retire-btn').addEventListener('click', () => {
    playWarningSound();
    showConfirmModal('リタイアしますか？', () => retireGame());
});
document.getElementById('confirm-yes').addEventListener('click', () => {
    playConfirmSound();
    document.getElementById('confirm-modal').classList.add('hidden');
    const cb = confirmCallback;
    confirmCallback = null;
    if (cb) cb();
});
document.getElementById('confirm-no').addEventListener('click', () => {
    playCancelSound();
    document.getElementById('confirm-modal').classList.add('hidden');
    confirmCallback = null;
});

function showConfirmModal(title, onYes) {
    document.getElementById('confirm-title').textContent = title;
    confirmCallback = onYes;
    document.getElementById('confirm-modal').classList.remove('hidden');
}
document.getElementById('pause-resume-btn').addEventListener('click', () => { playConfirmSound(); resumeGame(); });

document.getElementById('mobile-pause-btn').addEventListener('click', () => {
    playOpenSound();
    if (gameState === 'playing' || gameState === 'phaseTransition') pauseGame();
});
document.getElementById('restart-btn').addEventListener('click', () => {
    startGame(window.gameMode || 'standard');
});
document.getElementById('title-btn').addEventListener('click', () => { playCloseSound(); goToTitle(); });
document.getElementById('tweet-btn').addEventListener('click', () => { playConfirmSound(); shareTweet(); });

function shareTweet() {
    const score = getScore().toLocaleString();
    const mode = getModeLabel();
    const phase = getPhase();
    const text = `コンボローグストライク\n${mode} モード ${score}点！\n到達フェーズ: ${phase}\n\n#コンボローグストライク`;
    const url = 'https://2bta-web.github.io/Combo-Battler/';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

document.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
        if (gameState === 'start') {
            const selected = document.querySelector('.mode-btn.selected');
            if (selected) startGame(selected.dataset.mode);
        } else if (gameState === 'phaseTransition') {
            const el = document.elementFromPoint(mouseX, mouseY);
            const choiceEl = el?.closest('.choice-option');
            if (choiceEl) choiceEl.click();
        }
    }
    if (e.key === 'Escape') {
        if (!SETTINGS_MODAL.classList.contains('hidden')) {
            SETTINGS_MODAL.classList.add('hidden');
            return;
        }
        if (!document.getElementById('confirm-modal').classList.contains('hidden')) {
            document.getElementById('confirm-modal').classList.add('hidden');
            confirmCallback = null;
            return;
        }
        if (!document.getElementById('layout-editor').classList.contains('hidden')) {
            closeLayoutEditor();
            return;
        }
        if (gameState === 'playing' || gameState === 'phaseTransition') pauseGame();
        else if (gameState === 'paused') resumeGame();
    }
});

// Settings
const SETTINGS_MODAL = document.getElementById('settings-modal');
document.getElementById('settings-btn').addEventListener('click', () => {
    playOpenSound();
    SETTINGS_MODAL.classList.remove('hidden');
    const savedVol = Math.round((parseFloat(localStorage.getItem('comboBattlerVolume') || '1')) * 100);
    document.getElementById('settings-volume').value = savedVol;
    document.getElementById('settings-volume-label').textContent = savedVol;
    const shake = localStorage.getItem('comboBattlerShake') || 'strong';
    document.querySelectorAll('#settings-shake .toggle-option').forEach(el => el.classList.toggle('active', el.dataset.value === shake));
});
document.getElementById('settings-close').addEventListener('click', () => { playCloseSound(); SETTINGS_MODAL.classList.add('hidden'); });
document.getElementById('settings-clear-data').addEventListener('click', () => {
    playWarningSound();
    showConfirmModal('ハイスコア・設定・レイアウトをすべて消去します。よろしいですか？', () => {
        showConfirmModal('本当に消去しますか？この操作は元に戻せません。', () => {
            localStorage.clear();
            location.reload();
        });
    });
});
document.getElementById('settings-volume').addEventListener('input', (e) => {
    document.getElementById('settings-volume-label').textContent = e.target.value;
    setVolume(e.target.value / 100);
    playPreviewSound();
});
document.getElementById('settings-shake').addEventListener('click', (e) => {
    const opt = e.target.closest('.toggle-option');
    if (!opt) return;
    document.querySelectorAll('#settings-shake .toggle-option').forEach(el => el.classList.remove('active'));
    opt.classList.add('active');
    try { localStorage.setItem('comboBattlerShake', opt.dataset.value); } catch(ex) {}
});

// Pause tabs
document.querySelectorAll('.pause-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        playCancelSound();
        document.querySelectorAll('.pause-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.pause-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('pause-tab-' + tab.dataset.tab).classList.add('active');
    });
});

// Pause volume + shake
document.getElementById('pause-volume').addEventListener('input', (e) => {
    document.getElementById('pause-volume-label').textContent = e.target.value;
    setVolume(e.target.value / 100);
});
document.getElementById('pause-shake').addEventListener('click', (e) => {
    const opt = e.target.closest('.toggle-option');
    if (!opt) return;
    document.querySelectorAll('#pause-shake .toggle-option').forEach(el => el.classList.remove('active'));
    opt.classList.add('active');
    try { localStorage.setItem('comboBattlerShake', opt.dataset.value); } catch(ex) {}
});

START_SCREEN.addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-btn');
    if (btn) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const mode = btn.dataset.mode;
        resumeAudio();
        startGame(mode);
    }
});

function startGame(mode) {
    window.gameMode = mode;
    startTime = Date.now();
    gameState = 'playing';
    START_SCREEN.classList.add('hidden');
    RESULT_SCREEN.classList.add('hidden');

    initGame();
    applyLayout();

    const msgs = { standard: '10フェーズ 標準難易度', hard: '10フェーズ 超速タイミング', endless: '上限なし スコアアタック' };
    showText(msgs[mode]);
    addLog(`【${getModeLabel()}】開始！`);
    resumeAudio();
    playGameStartSound();
    startGameLoop();
}

function getModeLabel() {
    const map = { standard: 'Standard', hard: 'Hard', endless: 'Endless' };
    return map[window.gameMode] || 'Standard';
}

function initGame() {
    stats = { perfect: 0, good: 0, ok: 0, early: 0, miss: 0, totalHits: 0, maxCombo: 0, blue: 0, purple: 0, gold: 0, red: 0, maxStreak: 0 };
    scoreBreakdown = { base: 0, crit: 0, doubleStrike: 0, echo: 0, lucky: 0, damage: 0, feverBonus: 0, chain: 0, absorb: 0, finisher: 0, streak: 0 };
    initAudio();
    initPhase();
    initCombo();
    initEnemy();
    initTargets();
    initUI();
    loadHighScore();
}

function startGameLoop() {
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    if (targetSpawnTimer) clearTimeout(targetSpawnTimer);
    spawnNextTarget();
    gameLoopId = requestAnimationFrame(update);
}

function update(time) {
    if (gameState === 'playing') {
        const ft = document.getElementById('fever-timer');
        if (isFever()) {
            ft.classList.remove('hidden');
            ft.style.color = '#ffd700';
            const remaining = Math.max(0, Math.ceil(window.feverEndTime - Date.now()));
            document.getElementById('fever-timer-text').textContent = `FEVER ${remaining}s`;
        } else if (window.feverCooldownEnd && Date.now() < window.feverCooldownEnd) {
            ft.classList.remove('hidden');
            ft.style.color = '#666';
            const remaining = Math.ceil((window.feverCooldownEnd - Date.now()) / 1000);
            document.getElementById('fever-timer-text').textContent = `準備中 ${remaining}s`;
        } else if (window.feverCooldownEnd) {
            ft.classList.add('hidden');
            window.feverCooldownEnd = 0;
        }
        gameLoopId = requestAnimationFrame(update);
    }
}

function spawnNextTarget() {
    if (gameState !== 'playing') return;
    const phase = getPhase();
    const isEndless = window.gameMode === 'endless';
    const spawnDelay = Math.max(isEndless ? 350 : 400, 1200 - (phase - 1) * 80);
    targetSpawnTimer = setTimeout(() => {
        if (gameState === 'playing') spawnTarget(phase, true);
    }, spawnDelay);
}

function pauseGame() {
    if (gameState !== 'playing' && gameState !== 'phaseTransition') return;
    window.wasChoiceOpen = gameState === 'phaseTransition';
    if (window.wasChoiceOpen) {
        document.getElementById('choice-modal').classList.add('hidden');
    }
    gameState = 'paused';
    if (targetSpawnTimer) { clearTimeout(targetSpawnTimer); targetSpawnTimer = null; }
    pauseTargets();
    document.getElementById('pause-overlay').classList.remove('hidden');
    document.getElementById('pause-volume').value = Math.round(getVolume() * 100);
    document.getElementById('pause-volume-label').textContent = Math.round(getVolume() * 100);
    const shakeVal = localStorage.getItem('comboBattlerShake') || 'strong';
    document.querySelectorAll('#pause-shake .toggle-option').forEach(el => el.classList.toggle('active', el.dataset.value === shakeVal));

    const list = getActiveUpgrades();
    const el = document.getElementById('pause-upgrade-list');
    el.innerHTML = '';
    if (list.length === 0) {
        el.innerHTML = '<div class="upgrade-item dim">まだ強化なし</div>';
    } else {
        list.forEach(u => {
            const d = document.createElement('div');
            d.className = 'upgrade-item';
            d.textContent = u;
            el.appendChild(d);
        });
    }
}

function resumeGame() {
    if (gameState !== 'paused') return;
    gameState = window.wasChoiceOpen ? 'phaseTransition' : 'playing';
    if (window.wasChoiceOpen) {
        document.getElementById('choice-modal').classList.remove('hidden');
    }
    window.wasChoiceOpen = false;
    resumeTargets();
    document.getElementById('pause-overlay').classList.add('hidden');
    if (gameState === 'playing') {
        targetSpawnTimer = setTimeout(() => {
            if (gameState === 'playing') spawnTarget(getPhase(), true);
        }, 300);
        gameLoopId = requestAnimationFrame(update);
    }
}

function updateModeDisplay() {}

window.onTargetHit = function(judgment, targetType) {
    if (gameState !== 'playing') return;

    const judgmentMultiplier = { perfect: 1.5, good: 1.0, ok: 0.6, early: 0 };
    const typeDamageMultiplier = targetType === 'red' ? 2 : (targetType === 'gold' ? 1.5 : 1);
    const typeScoreMultiplier = targetType === 'red' ? 3 : (targetType === 'gold' ? 2 : (targetType === 'purple' ? 1.5 : 1));

    const baseDmg = getBaseDamage() * (judgmentMultiplier[judgment] || 0) * typeDamageMultiplier;
    if (baseDmg <= 0) {
        stats.early++;
        addLog('Early! ダメージなし');
        playMissSound();
        updateCombatInfo();
        resetPerfectStreak();
        return;
    }

    const comboMult = getMultiplier();
    const preCritDmg = Math.floor(baseDmg * comboMult);
    let actualDamage = preCritDmg;

    let isCritical = false;
    const critMult = getCriticalMultiplier();
    if (critMult > 1) {
        actualDamage = Math.floor(actualDamage * critMult);
        isCritical = true;
        scoreBreakdown.crit += actualDamage - preCritDmg;
        addLog('クリティカル!');
    }

    scoreBreakdown.base += preCritDmg;
    damageEnemy(actualDamage, isCritical);
    addCombo();
    const mainScoreNoFever = Math.floor(actualDamage * typeScoreMultiplier * getScoreMultiplier());
    if (targetType === 'blue') stats.blue++;
    else if (targetType === 'purple') stats.purple++;
    else if (targetType === 'gold') stats.gold++;
    else if (targetType === 'red') stats.red++;
    else stats.blue++;
    const scoreMult = isFever() ? 2 : 1;
    const mainScoreFinal = Math.floor(actualDamage * scoreMult * typeScoreMultiplier * getScoreMultiplier());
    addScore(mainScoreFinal);
    scoreBreakdown.damage += mainScoreNoFever;
    if (isFever()) scoreBreakdown.feverBonus += mainScoreFinal - mainScoreNoFever;
    updateCombatInfo();

    const combo = getCombo();

    if (judgment === 'perfect') {
        stats.perfect++;
        stats.totalHits++;
        stats.maxCombo = Math.max(stats.maxCombo, getCombo());
        playPerfectSound();
        screenShake();
        addLog(`Perfect! ${actualDamage}ダメージ コンボ${combo}${targetType !== 'normal' ? ' [' + targetType + ']' : ''}`);

        const streakMult = addPerfectStreak();
        stats.maxStreak = Math.max(stats.maxStreak, getPerfectStreak());
        if (streakMult > 0) {
            const bonus = Math.floor(actualDamage * streakMult);
            damageEnemy(bonus);
            scoreBreakdown.streak += bonus;
            addLog(`＋${bonus} ストリークボーナス!`);
            if (getEnemyHPPercent() <= 0) { enemyDefeated(); return; }
        }
    } else {
        if (judgment === 'good') { stats.good++; playGoodSound(); }
        else if (judgment === 'ok') { stats.ok++; playOkSound(); }
        else playHitSound();
        stats.totalHits++;
        stats.maxCombo = Math.max(stats.maxCombo, getCombo());
        resetPerfectStreak();
        addLog(`${actualDamage}ダメージ コンボ${combo}${targetType !== 'normal' ? ' [' + targetType + ']' : ''}`);
    }

    if (combo === 50) {
        showLightningEffect();
        playMilestone50Sound();
        addLog('⚡ 50コンボ!');
        spawnComboParticles(window.innerWidth / 2, window.innerHeight / 2);
    } else if (combo === 75) {
        screenFlash();
        addLog('75コンボ!');
    } else if (combo === 100) {
        showLightningEffect();
        playMilestone50Sound();
        addLog('🔥 100コンボ!');
        spawnComboParticles(window.innerWidth / 2, window.innerHeight / 2);
    } else if (combo > 100 && combo % 100 === 0) {
        showLightningEffect();
        playMilestone50Sound();
        addLog(`🔥 ${combo}コンボ!`);
        spawnComboParticles(window.innerWidth / 2, window.innerHeight / 2);
    } else if (combo > 50 && combo % 5 === 0) {
        addLog(`${combo} コンボ`);
    } else if (combo === 10) {
        screenFlash();
        playMilestone10Sound();
        addLog('10コンボ!');
    } else if (combo === 5) {
        addLog('5コンボ!');
    }

    if (combo >= 5 && combo % 5 === 0) {
        playComboSound();
    }

    if (combo === 15 && canStartFever()) {
        activateFever();
        playFeverSound();
        addLog('🔥 FEVER! 30秒間スコア2倍');
    }

    const chainBonus = getChainBonus();
    if (chainBonus > 0) {
        addScore(chainBonus);
        scoreBreakdown.chain += chainBonus;
        addLog(`チェインボーナス +${chainBonus}`);
    }

    const dsMult = getDoubleStrikeMultiplier();
    if (dsMult > 1) {
        const extraDmg = Math.floor(actualDamage * (dsMult - 1));
        damageEnemy(extraDmg);
        const dsScoreNoFever = extraDmg;
        addScore(Math.floor(extraDmg * scoreMult));
        scoreBreakdown.doubleStrike += extraDmg;
        scoreBreakdown.damage += dsScoreNoFever;
        if (isFever()) scoreBreakdown.feverBonus += Math.floor(extraDmg * scoreMult) - dsScoreNoFever;
        updateCombatInfo();
        addLog(`連撃! x${dsMult} +${extraDmg}`);
        if (getEnemyHPPercent() <= 0) { enemyDefeated(); return; }
    }

    if (checkLucky()) {
        const luckyDmg = Math.floor(getPhase() * 100);
        damageEnemy(luckyDmg);
        const luckyScoreNoFever = luckyDmg;
        addScore(Math.floor(luckyDmg * scoreMult));
        scoreBreakdown.lucky += luckyDmg;
        scoreBreakdown.damage += luckyScoreNoFever;
        if (isFever()) scoreBreakdown.feverBonus += Math.floor(luckyDmg * scoreMult) - luckyScoreNoFever;
        updateCombatInfo();
        addLog('🍀 ラッキー!');
        if (getEnemyHPPercent() <= 0) { enemyDefeated(); return; }
    }

    if (isEcho()) {
        const echoDmg = Math.floor(actualDamage * 1.0);
        damageEnemy(echoDmg);
        const echoScoreNoFever = echoDmg;
        addScore(Math.floor(echoDmg * scoreMult));
        scoreBreakdown.echo += echoDmg;
        scoreBreakdown.damage += echoScoreNoFever;
        if (isFever()) scoreBreakdown.feverBonus += Math.floor(echoDmg * scoreMult) - echoScoreNoFever;
        updateCombatInfo();
        addLog(`エコー! +${echoDmg}`);
        if (getEnemyHPPercent() <= 0) { enemyDefeated(); return; }
    }

    if (getEnemyHPPercent() <= 0) {
        enemyDefeated();
    }
};

window.onTargetMiss = function() {
    if (gameState !== 'playing') return;
    stats.miss++;

    if (consumeBarrier()) {
        updateCombatInfo();
        playMissSound();
        addLog(`障壁発動! 残り${getBarrierCharges()}回`);
        return;
    }

    if (window.gameMode === 'endless') {
        retireGame('Game Over');
        return;
    }

    if (isComboSafe()) {
        const reduction = Math.min(getComboSafeReduction(), getCombo());
        setCombo(getCombo() - reduction);
        updateCombatInfo();
        playMissSound();
        addLog(`Miss... コンボ-${reduction}`);
    } else {
        resetCombo();
        updateCombatInfo();
        playMissSound();
        addLog('Miss... コンボリセット');
    }
};

window.onBatchComplete = function() {
    if (gameState === 'playing') spawnNextTarget();
};

function enemyDefeated() {
    playDefeatAnimation();
    gameState = 'phaseTransition';
    clearTargets();
    pauseFeverSystem();
    playPhaseClearSound();

    const phase = getPhase();
    const isBoss = isBossPhase(phase);
    clearBossMode();

    const finisherBonus = getFinisherBonus();
    if (finisherBonus > 0) {
        const bonus = Math.min(phase, 10) * 15 * finisherBonus;
        addScore(bonus);
        scoreBreakdown.finisher += bonus;
        addLog(`フィニッシャー +${bonus}`);
    }

    const maxPhase = getMaxPhase();

    addLog(`フェーズ${phase}クリア！`);
    showText(`フェーズ${phase}クリア！`);

    if (phase >= maxPhase) {
        gameComplete();
        return;
    }

    if (isBoss) {
        showText('ボス撃破! 2つ選べ');
        setTimeout(() => showBossChoices(), 800);
    } else if (shouldOfferUpgrade()) {
        showText('選択肢を選んでください');
        setTimeout(() => showChoices(), 800);
    } else {
        nextPhase();
        const newPhase = getPhase();
        if (isBossPhase(newPhase)) setBossMode();
        setEnemyHP(getEnemyHP(newPhase));
        resumeFeverSystem();
        updateInfoBar();
        showText(`フェーズ${getPhase()}開始！`);
        addLog(`フェーズ${getPhase()}開始`);
        if (isBossPhase(newPhase + 1)) {
            addLog(`⚠ 次はボスフェーズ (Phase ${newPhase + 1})！`);
        }
        gameState = 'playing';
        startGameLoop();
    }
}

window.onChoiceSelected = function() {
    playSelectSound();
    lastUpgradePhase = getPhase();
    addLog('選択肢決定');
    nextPhase();
    const newPhase = getPhase();
    if (isBossPhase(newPhase)) setBossMode();
    setEnemyHP(getEnemyHP(newPhase));
    resumeFeverSystem();
    updateInfoBar();
    showText(`フェーズ${getPhase()}開始！`);
    addLog(`フェーズ${getPhase()}開始`);
    if (isBossPhase(newPhase + 1)) {
        addLog(`⚠ 次はボスフェーズ (Phase ${newPhase + 1})！`);
    }
    gameState = 'playing';
    startGameLoop();
};

function getEnemyHP(phase) {
    const base = getHPForPhase ? getHPForPhase(phase) : 100 + (phase - 1) * 30;
    return isBossPhase(phase) ? base * 3 : base;
}

function goToTitle() {
    gameState = 'start';
    if (targetSpawnTimer) { clearTimeout(targetSpawnTimer); targetSpawnTimer = null; }
    RESULT_SCREEN.classList.add('hidden');
    document.getElementById('choice-modal').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('fever-timer').classList.add('hidden');
    START_SCREEN.classList.remove('hidden');
    clearTargets();
    loadHighScore();
    applyLayout();
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
}

function updateResultStats() {
    const s = stats;
    s.maxCombo = Math.max(s.maxCombo, getCombo());
    document.getElementById('stat-perfect').textContent = s.perfect;
    document.getElementById('stat-good').textContent = s.good;
    document.getElementById('stat-ok').textContent = s.ok;
    document.getElementById('stat-miss').textContent = s.miss;
    document.getElementById('stat-early').textContent = s.early;
    document.getElementById('stat-maxcombo').textContent = s.maxCombo;
    document.getElementById('stat-maxstreak').textContent = s.maxStreak;
    document.getElementById('stat-blue').textContent = s.blue;
    document.getElementById('stat-purple').textContent = s.purple;
    document.getElementById('stat-gold').textContent = s.gold;
    document.getElementById('stat-red').textContent = s.red;
    const total = s.perfect + s.good + s.ok + s.miss + s.early;
    if (total > 0) {
        const hits = s.perfect + s.good + s.ok;
        document.getElementById('stat-accuracy').textContent = (hits / total * 100).toFixed(1) + '%';
    } else {
        document.getElementById('stat-accuracy').textContent = '-';
    }

    const list = document.getElementById('result-upgrade-list');
    list.innerHTML = '';
    const upgrades = getRunUpgrades ? getRunUpgrades() : [];
    if (upgrades.length === 0) {
        list.innerHTML = '<div style="color:#555;font-size:13px;">なし</div>';
    } else {
        const counts = {};
        upgrades.forEach(u => { counts[u] = (counts[u] || 0) + 1; });
        const maxIds = { 3: 'コンボ倍率UP', 4: 'ターゲット拡大', 5: '余裕UP', 8: 'チェイン', 9: 'ラッキー', 12: '吸収', 13: 'エコー' };
        const atMax = {};
        for (const id in maxIds) {
            const name = maxIds[id];
            if (id === '3' && getComboMultiplierUp && getComboMultiplierUp() > 0) atMax[name] = true;
            if (id === '4' && getTargetSizeBonus && getTargetSizeBonus() >= 0.30) atMax[name] = true;
            if (id === '5' && getSpawnTimeBonus && getSpawnTimeBonus() >= 0.40) atMax[name] = true;
            if (id === '8' && getChainBonus && getChainBonus() > 0) atMax[name] = true;
            if (id === '9' && getLuckyChance && getLuckyChance() > 0) atMax[name] = true;
            if (id === '12' && getAbsorbBonus && getAbsorbBonus() > 0) atMax[name] = true;
            if (id === '13' && getEchoRate && getEchoRate() >= 0.40) atMax[name] = true;
        }
        for (const name in counts) {
            const d = document.createElement('div');
            const suffix = counts[name] > 1 ? ` ×${counts[name]}` : '';
            const maxSuffix = atMax[name] ? ' (max)' : '';
            d.textContent = name + suffix + maxSuffix;
            list.appendChild(d);
        }
    }
    const bd = scoreBreakdown;
    const dmgTotal = bd.base + bd.crit + bd.doubleStrike + bd.echo + bd.lucky + bd.streak;
    document.getElementById('bd-damage-total').textContent = dmgTotal.toLocaleString();
    document.getElementById('bd-base').textContent = bd.base.toLocaleString();
    document.getElementById('bd-crit').textContent = bd.crit.toLocaleString();
    document.getElementById('bd-ds').textContent = bd.doubleStrike.toLocaleString();
    document.getElementById('bd-echo').textContent = bd.echo.toLocaleString();
    document.getElementById('bd-lucky').textContent = bd.lucky.toLocaleString();
    document.getElementById('bd-streak').textContent = bd.streak.toLocaleString();
    document.getElementById('bd-damage').textContent = bd.damage.toLocaleString();
    document.getElementById('bd-fever').textContent = bd.feverBonus.toLocaleString();
    document.getElementById('bd-chain').textContent = bd.chain.toLocaleString();
    document.getElementById('bd-absorb').textContent = bd.absorb.toLocaleString();
    document.getElementById('bd-finisher').textContent = bd.finisher.toLocaleString();
}

function getHighScoreForMode(mode) {
    try { return parseInt(localStorage.getItem('comboBattlerHS_' + (mode || 'standard')) || '0', 10); } catch(e) { return 0; }
}

function formatPlayTime() {
    const secs = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function retireGame(title) {
    gameState = 'result';
    if (targetSpawnTimer) { clearTimeout(targetSpawnTimer); targetSpawnTimer = null; }
    clearTargets();
    playRetireSound();
    document.getElementById('choice-modal').classList.add('hidden');
    const finalScore = getScore();
    const isNewRecord = saveHighScore(finalScore);

    document.getElementById('result-title').textContent = title || 'リタイア';
    document.getElementById('result-mode-display').textContent = getModeLabel();
    document.getElementById('final-score').textContent = finalScore.toLocaleString();
    const maxPhase = getMaxPhase();
    document.getElementById('final-phase').textContent = maxPhase === Infinity ? `${getPhase()} / ∞` : `${getPhase()} / ${maxPhase}`;

    const newRecordEl = document.getElementById('new-record');
    if (newRecordEl) newRecordEl.classList.toggle('hidden', !isNewRecord);
    document.getElementById('highscore-value').textContent = getHighScoreForMode(window.gameMode).toLocaleString();
    document.getElementById('playtime-value').textContent = formatPlayTime();
    updateResultStats();

    RESULT_SCREEN.classList.remove('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('fever-timer').classList.add('hidden');
    addLog(`リタイア 最終スコア: ${finalScore.toLocaleString()}`);
}

function gameComplete() {
    gameState = 'result';
    const finalScore = getScore();
    const isNewRecord = saveHighScore(finalScore);

    playGameClearSound();

    const maxPhase2 = getMaxPhase();

    document.getElementById('result-title').textContent = 'ゲームクリア！';
    document.getElementById('result-mode-display').textContent = getModeLabel();
    document.getElementById('final-score').textContent = finalScore.toLocaleString();
    document.getElementById('final-phase').textContent = `${getPhase()} / ${maxPhase2}`;

    const newRecordEl = document.getElementById('new-record');
    if (newRecordEl) newRecordEl.classList.toggle('hidden', !isNewRecord);
    document.getElementById('highscore-value').textContent = getHighScoreForMode(window.gameMode).toLocaleString();
    document.getElementById('playtime-value').textContent = formatPlayTime();
    updateResultStats();

    RESULT_SCREEN.classList.remove('hidden');
    document.getElementById('fever-timer').classList.add('hidden');
    addLog(`ゲームクリア！最終スコア: ${finalScore.toLocaleString()}`);
}

function loadHighScore() {
    const modes = ['standard', 'hard', 'endless'];
    modes.forEach(mode => {
        try {
            const val = parseInt(localStorage.getItem('comboBattlerHS_' + mode) || '0', 10);
            const el = document.getElementById('hs-' + mode);
            if (el) el.textContent = val.toLocaleString();
        } catch(e) {}
    });
}

function saveHighScore(score) {
    const mode = window.gameMode || 'standard';
    const key = 'comboBattlerHS_' + mode;
    let current = 0;
    try { current = parseInt(localStorage.getItem(key) || '0', 10); } catch(e) {}
    if (score > current) {
        try { localStorage.setItem(key, String(score)); } catch(e) {}
        return true;
    }
    return false;
}

function screenShake() {
    const setting = localStorage.getItem('comboBattlerShake') || 'strong';
    if (setting === 'off') return;
    document.body.classList.remove('shake');
    void document.body.offsetWidth;
    if (setting === 'weak') document.body.classList.add('shake-weak');
    else document.body.classList.add('shake');
    setTimeout(() => {
        document.body.classList.remove('shake', 'shake-weak');
    }, 150);
}

function screenFlash() {
    document.body.classList.remove('flash');
    void document.body.offsetWidth;
    document.body.classList.add('flash');
    setTimeout(() => document.body.classList.remove('flash'), 300);
}

function showLightningEffect() {
    const enemy = document.getElementById('enemy');
    const bolt = document.createElement('div');
    bolt.className = 'enemy-lightning';
    bolt.textContent = '⚡';
    enemy.appendChild(bolt);
    setTimeout(() => bolt.remove(), 500);
}

function getGameState() {
    return gameState;
}

/* Layout editor */
const LAYOUT_ITEMS = ['phase-area', 'score-area', 'combo-area', 'log-container', 'streak-area', 'fever-timer'];

function openLayoutEditor() {
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('layout-editor').classList.remove('hidden');

    const ft = document.getElementById('fever-timer');
    ft.dataset.wasHidden = ft.classList.contains('hidden');
    ft.classList.remove('hidden');
    document.getElementById('fever-timer-text').textContent = 'FEVER 30s';
    ft.style.color = '#ffd700';
    const ftStyle = getComputedStyle(ft);
    const ftB = parseFloat(ftStyle.bottom);
    if (!isNaN(ftB)) ft.style.top = (window.innerHeight - ftB - ft.offsetHeight) + 'px';
    ft.style.bottom = 'auto';
    const ftR = parseFloat(ftStyle.right);
    if (!isNaN(ftR)) ft.style.left = (window.innerWidth - ftR - ft.offsetWidth) + 'px';
    ft.style.right = 'auto';

    LAYOUT_ITEMS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('editing');
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        el.appendChild(handle);
        el.addEventListener('mousedown', startDrag);
        el.addEventListener('touchstart', startDrag, { passive: false });
        handle.addEventListener('mousedown', startResize);
        handle.addEventListener('touchstart', startResize, { passive: false });
    });
}

function closeLayoutEditor() {
    document.getElementById('layout-editor').classList.add('hidden');
    LAYOUT_ITEMS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('editing');
        el.querySelector('.resize-handle')?.remove();
    });
    const ft = document.getElementById('fever-timer');
    if (ft.dataset.wasHidden === 'true') ft.classList.add('hidden');
    delete ft.dataset.wasHidden;
    if (gameState === 'paused') {
        document.getElementById('pause-overlay').classList.remove('hidden');
    } else if (gameState === 'start') {
        document.getElementById('settings-modal').classList.remove('hidden');
    }
}

function startDrag(e) {
    if (e.target.closest('.resize-handle')) return;
    e.preventDefault();
    const item = e.currentTarget;
    item.style.cursor = 'grabbing';
    document.querySelectorAll('.snap-guide').forEach(el => el.remove());
    const rect = item.getBoundingClientRect();
    const gcRect = document.getElementById('game-container').getBoundingClientRect();
    const shiftX = (e.clientX || e.touches[0].clientX) - rect.left;
    const shiftY = (e.clientY || e.touches[0].clientY) - rect.top;
    const itemW = rect.width;
    const itemH = rect.height;

    const others = LAYOUT_ITEMS.filter(id => document.getElementById(id) !== item).map(id => document.getElementById(id)).filter(el => el);

    function getSnap(x, y) {
        const gc = document.getElementById('game-container');
        const gw = gc.offsetWidth;
        const gh = gc.offsetHeight;
        const SNAP = 10;
        let snapX = x, snapY = y;
        const guides = [];
        const cx = x + itemW / 2;
        const cy = y + itemH / 2;

        // Screen center
        if (Math.abs(cx - gw / 2) < SNAP) { snapX = gw / 2 - itemW / 2; guides.push({ type: 'v', pos: gw / 2 }); }
        if (Math.abs(cy - gh / 2) < SNAP) { snapY = gh / 2 - itemH / 2; guides.push({ type: 'h', pos: gh / 2 }); }

        // Other element centers
        others.forEach(o => {
            if (!o || !o.classList.contains('editing')) return;
            const or = o.getBoundingClientRect();
            const oCx = or.left - gcRect.left + or.width / 2;
            const oCy = or.top - gcRect.top + or.height / 2;
            if (Math.abs(cx - oCx) < SNAP) { snapX = oCx - itemW / 2; guides.push({ type: 'v', pos: oCx }); }
            if (Math.abs(cy - oCy) < SNAP) { snapY = oCy - itemH / 2; guides.push({ type: 'h', pos: oCy }); }
        });

        return { x: snapX, y: snapY, guides };
    }

    function move(m) {
        document.querySelectorAll('.snap-guide').forEach(el => el.remove());
        let x = (m.clientX || m.touches[0].clientX) - shiftX - gcRect.left;
        let y = (m.clientY || m.touches[0].clientY) - shiftY - gcRect.top;
        const snap = getSnap(x, y);
        item.style.left = snap.x + 'px';
        item.style.top = snap.y + 'px';
        item.style.right = 'auto';
        item.style.bottom = 'auto';
        snap.guides.forEach(g => {
            const guide = document.createElement('div');
            guide.className = 'snap-guide ' + g.type;
            if (g.type === 'h') guide.style.top = (g.pos + gcRect.top) + 'px';
            else guide.style.left = (g.pos + gcRect.left) + 'px';
            document.getElementById('layout-editor').appendChild(guide);
        });
    }

    function stop() {
        document.querySelectorAll('.snap-guide').forEach(el => el.remove());
        item.style.cursor = 'grab';
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', stop);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('touchend', stop);
    }

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', stop);
}

function startResize(e) {
    e.preventDefault();
    e.stopPropagation();
    const item = e.currentTarget.parentElement;
    const startW = item.offsetWidth;
    const startH = item.offsetHeight;
    if (startW <= 0 || startH <= 0) return;
    const startX = (e.clientX || e.touches[0].clientX);
    const ratio = startW / startH;

    const origFonts = [];
    const allChildren = item.querySelectorAll('*');
    allChildren.forEach(child => {
        if (child.classList.contains('resize-handle')) return;
        const fs = parseFloat(window.getComputedStyle(child).fontSize);
        if (fs && !isNaN(fs) && fs > 0) origFonts.push({ el: child, size: fs });
    });

    function resize(m) {
        const dx = (m.clientX || m.touches[0].clientX) - startX;
        const newW = Math.max(60, startW + dx);
        const newH = Math.round(newW / ratio);
        const scale = newW / startW;
        item.style.width = newW + 'px';
        item.style.height = newH + 'px';
        origFonts.forEach(f => f.el.style.fontSize = (f.size * scale) + 'px');
    }

    function stop() {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stop);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('touchend', stop);
    }

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stop);
    document.addEventListener('touchmove', resize, { passive: false });
    document.addEventListener('touchend', stop);
}

function saveLayout() {
    const gc = document.getElementById('game-container');
    const gcRect = gc.getBoundingClientRect();
    const positions = {};
    LAYOUT_ITEMS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const fonts = [];
        el.querySelectorAll('*').forEach(child => {
            if (child.classList.contains('resize-handle')) return;
            if (child.style.fontSize) fonts.push({ id: child.id || child.className, size: child.style.fontSize });
        });
        positions[id] = { top: r.top - gcRect.top, left: r.left - gcRect.left, w: r.width, h: r.height, fonts };
    });
    try { localStorage.setItem('comboBattlerLayout', JSON.stringify(positions)); } catch(e) {}
    closeLayoutEditor();
    applyLayout();
}

function resetLayout() {
    LAYOUT_ITEMS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';
        el.style.right = '';
        el.style.width = '';
        el.style.height = '';
        el.querySelectorAll('*').forEach(c => c.style.fontSize = '');
    });
    try { localStorage.removeItem('comboBattlerLayout'); } catch(e) {}
    closeLayoutEditor();
}

function applyLayout() {
    let positions;
    try { positions = JSON.parse(localStorage.getItem('comboBattlerLayout')); } catch(e) {}
    if (!positions) return;

    const gc = document.getElementById('game-container');
    const gcRect = gc.getBoundingClientRect();

    LAYOUT_ITEMS.forEach(id => {
        if (!positions[id]) return;
        const el = document.getElementById(id);
        if (!el) return;
        const p = positions[id];
        el.style.position = 'absolute';
        el.style.top = Math.round(p.top) + 'px';
        el.style.left = Math.round(p.left) + 'px';
        el.style.right = 'auto';
        if (p.w) el.style.width = Math.round(p.w) + 'px';
        if (p.h) el.style.height = Math.round(p.h) + 'px';
        if (p.fonts) {
            p.fonts.forEach(f => {
                const target = f.id ? document.getElementById(f.id) : el.querySelector('.' + f.id.split(' ')[0]);
                if (target) target.style.fontSize = f.size;
            });
        }
    });
}

document.getElementById('settings-layout-btn').addEventListener('click', () => { playOpenSound(); openLayoutEditor(); });
document.getElementById('pause-layout-btn').addEventListener('click', () => { playOpenSound(); openLayoutEditor(); });
document.getElementById('layout-preset').addEventListener('click', () => { playConfirmSound(); applyPreset(); });
document.getElementById('layout-save').addEventListener('click', () => { playConfirmSound(); saveLayout(); });
document.getElementById('layout-reset').addEventListener('click', () => { playWarningSound(); resetLayout(); });
document.getElementById('layout-close').addEventListener('click', () => { playCloseSound(); closeLayoutEditor(); });

loadHighScore();
initAudio();

document.getElementById('bd-toggle').addEventListener('click', () => {
    const detail = document.getElementById('bd-detail');
    detail.classList.toggle('hidden');
    document.getElementById('bd-toggle').textContent = detail.classList.contains('hidden') ? '[詳細▼]' : '[詳細▲]';
});

function applyPreset() {
    const gw = window.innerWidth;
    const MARGIN = 60;
    const preset = {
        'phase-area': { top: 10, left: 883, w: 109, h: 77 },
        'score-area': { top: 10, left: 1436 },
        'combo-area': { top: 694, left: 888, w: 99, h: 166 },
        'streak-area': { top: 773, left: 891, w: 93, h: 57 },
        'log-container': { top: 110, left: 10, w: 360 }
    };
    LAYOUT_ITEMS.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !preset[id]) return;
        el.style.position = 'absolute';
        el.style.top = preset[id].top + 'px';
        el.style.left = Math.min(preset[id].left, gw - MARGIN) + 'px';
        el.style.right = 'auto';
        if (preset[id].w) el.style.width = preset[id].w + 'px';
        if (preset[id].h) el.style.height = preset[id].h + 'px';
        el.querySelectorAll('*').forEach(c => c.style.fontSize = '');
    });
}