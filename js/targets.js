const TARGET_LAYER = document.getElementById('target-layer');
let activeTargets = [];
let batchSpawnTotal = 0;
let staggeredTimeouts = [];
let mouseX = 0, mouseY = 0;

const TARGET_POSITIONS = [];

function initTargets() {
    clearTargets();
    staggeredTimeouts = [];
    generateTargetPositions();
}

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

document.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && window.getGameState && window.getGameState() === 'playing') {
        e.preventDefault();
        for (const entry of activeTargets) {
            if (!entry.hit && entry.isClickable) {
                const rect = entry.el.getBoundingClientRect();
                if (mouseX >= rect.left && mouseX <= rect.right &&
                    mouseY >= rect.top && mouseY <= rect.bottom) {
                    handleTargetHit(entry);
                    break;
                }
            }
        }
    }
});

function generateTargetPositions() {
    TARGET_POSITIONS.length = 0;
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        TARGET_POSITIONS.push({ x: Math.cos(angle) * 130, y: Math.sin(angle) * 130 });
    }
}

function getTargetCountForPhase(phase) {
    if (phase <= 3) return 1;
    if (phase <= 6) return Math.random() < 0.3 ? 2 : 1;
    if (phase <= 8) return Math.random() < 0.5 ? 2 : 1;
    return Math.random() < 0.4 ? (Math.random() < 0.5 ? 3 : 2) : 1;
}

function getNonOverlappingPositions(count) {
    const pool = [...TARGET_POSITIONS].map((p, i) => ({ ...p, idx: i }));
    const result = [];

    for (let n = 0; n < count && pool.length > 0; n++) {
        const pick = Math.floor(Math.random() * pool.length);
        result.push({ x: pool[pick].x, y: pool[pick].y });
        const idx = pool[pick].idx;
        pool.splice(pick, 1);

        const forbidden = [(idx - 1 + 12) % 12, idx, (idx + 1) % 12];
        for (let i = pool.length - 1; i >= 0; i--) {
            if (forbidden.includes(pool[i].idx)) {
                pool.splice(i, 1);
            }
        }
    }
    return result;
}

function spawnTarget(phase, isPlaying) {
    if (!isPlaying) return;
    staggeredTimeouts.forEach(clearTimeout);
    staggeredTimeouts = [];
    const count = getTargetCountForPhase(phase);
    const positions = getNonOverlappingPositions(count);
    const staggeredDelay = 600;

    batchSpawnTotal = positions.length;

    positions.forEach((pos, i) => {
        const tid = setTimeout(() => {
            if (window.getGameState && window.getGameState() === 'playing') {
                createTarget(phase, pos);
            }
        }, i * staggeredDelay);
        staggeredTimeouts.push(tid);
    });
}

function createTarget(phase, position) {
    const targetSize = getTargetSizeForPhase(phase);
    const approachTime = getApproachTimeForPhase(phase);

    const el = document.createElement('div');
    el.className = 'target';
    el.style.width = `${targetSize}px`;
    el.style.height = `${targetSize}px`;
    el.style.left = `calc(50% + ${position.x}px)`;
    el.style.top = `calc(50% + ${position.y}px)`;

    const inner = document.createElement('div');
    inner.className = 'target-inner';
    el.appendChild(inner);

    const approach = document.createElement('div');
    approach.className = 'target-approach';
    approach.style.animationDuration = `${approachTime}ms`;
    el.appendChild(approach);
    el.classList.add('appearing');

    TARGET_LAYER.appendChild(el);

    const targetType = getTargetTypeForPhase(phase);
    if (targetType === 'purple') { el.classList.add('target-purple'); playPurplePopSound(); }
    else if (targetType === 'gold') { el.classList.add('target-gold'); playGoldPopSound(); }
    else if (targetType === 'red') { el.classList.add('target-red'); playRedPopSound(); }
    else playTargetPopSound();

    const entry = {
        el, approachTime, targetType,
        startTime: Date.now(),
        isClickable: false,
        hit: false
    };

    entry.clickableTimer = setTimeout(() => { entry.isClickable = true; }, 100);

    el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!entry.hit && entry.isClickable) {
            handleTargetHit(entry);
        }
    });

    entry.timeout = setTimeout(() => {
        if (!entry.hit && entry.isClickable) {
            handleTargetMiss(entry);
        }
    }, approachTime);

    activeTargets.push(entry);
}

function handleTargetHit(entry) {
    if (entry.hit || !entry.isClickable) return;
    entry.hit = true;
    if (entry.timeout) clearTimeout(entry.timeout);

    const elapsed = Date.now() - entry.startTime;
    const progress = elapsed / entry.approachTime;
    const judgment = getJudgment(progress);

    entry.el.classList.remove('appearing');
    entry.el.classList.add('hit');
    const approach = entry.el.querySelector('.target-approach');
    if (approach) approach.classList.add('missed');

    const rect = entry.el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    showJudgmentText(judgment, cx, cy);

    if (judgment === 'perfect') spawnPerfectParticles(cx, cy);
    else if (judgment === 'early') spawnMissParticles(cx, cy);
    else spawnHitParticles(cx, cy);

    entry.el.style.pointerEvents = 'none';
    setTimeout(() => {
        entry.el.remove();
        removeTarget(entry);
    }, 200);

    if (window.onTargetHit) window.onTargetHit(judgment, entry.targetType);
}

function handleTargetMiss(entry) {
    if (entry.hit || !entry.isClickable) return;
    entry.hit = true;

    entry.el.classList.remove('appearing');
    entry.el.classList.add('missed');
    const approach = entry.el.querySelector('.target-approach');
    if (approach) approach.classList.add('missed');

    const rect = entry.el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    spawnMissParticles(cx, cy);

    setTimeout(() => {
        entry.el.remove();
        removeTarget(entry);
    }, 300);

    if (window.onTargetMiss) window.onTargetMiss();
}

function getJudgment(progress) {
    if (progress >= 0.67) return 'perfect';
    if (progress >= 0.39) return 'good';
    if (progress >= 0.11) return 'ok';
    return 'early';
}

function showJudgmentText(judgment, x, y) {
    const textMap = { perfect: 'Perfect!', good: 'Good', ok: 'OK', early: 'Early' };
    const clsMap = { perfect: 'judgment-text perfect', good: 'judgment-text good', ok: 'judgment-text ok', early: 'judgment-text early' };
    const text = document.createElement('div');
    text.className = clsMap[judgment];
    text.textContent = textMap[judgment];
    text.style.position = 'fixed';
    text.style.left = `${x}px`;
    text.style.top = `${y - 40}px`;
    text.style.transform = 'translateX(-50%)';
    document.body.appendChild(text);
    setTimeout(() => text.remove(), 500);
}

function removeTarget(entry) {
    const idx = activeTargets.indexOf(entry);
    if (idx !== -1) activeTargets.splice(idx, 1);
    if (activeTargets.length === 0 && batchSpawnTotal > 0 && window.onBatchComplete) {
        batchSpawnTotal = 0;
        window.onBatchComplete();
    }
}

function clearTargets() {
    staggeredTimeouts.forEach(clearTimeout);
    staggeredTimeouts = [];
    activeTargets.forEach(e => {
        if (e.timeout) clearTimeout(e.timeout);
        if (e.clickableTimer) clearTimeout(e.clickableTimer);
        e.el.remove();
    });
    activeTargets = [];
    batchSpawnTotal = 0;
}

function pauseTargets() {
    activeTargets.forEach(e => {
        if (e.timeout) clearTimeout(e.timeout);
        const elapsed = Date.now() - e.startTime;
        e.remaining = Math.max(0, e.approachTime - elapsed);
        e.pauseStart = Date.now();
        const rings = e.el.querySelectorAll('.target-approach');
        rings.forEach(r => r.style.animationPlayState = 'paused');
        e.el.style.animationPlayState = 'paused';
    });
}

function resumeTargets() {
    activeTargets.forEach(e => {
        if (e.remaining > 0) {
            e.startTime += Date.now() - e.pauseStart;
            e.timeout = setTimeout(() => {
                if (!e.hit && e.isClickable) handleTargetMiss(e);
            }, e.remaining);
        }
        const rings = e.el.querySelectorAll('.target-approach');
        rings.forEach(r => r.style.animationPlayState = 'running');
        e.el.style.animationPlayState = 'running';
        delete e.remaining;
        delete e.pauseStart;
    });
}

function getTargetSizeForPhase(phase) {
    const mode = window.gameMode || 'standard';
    const base = (mode === 'hard') ? Math.max(40, 85 - (phase - 1) * 5) : Math.max(55, 85 - (phase - 1) * 3);
    return Math.round(base * (1 + (getTargetSizeBonus() || 0)));
}

function getApproachTimeForPhase(phase) {
    const mode = window.gameMode || 'standard';
    const base = (mode === 'hard') ? Math.max(350, 1500 - (phase - 1) * 130) : Math.max(600, 1500 - (phase - 1) * 80);
    return Math.round(base * (1 + (getSpawnTimeBonus() || 0)));
}

function getTargetTypeForPhase(phase) {
    if (phase <= 1) return 'normal';
    const roll = Math.random();
    if (phase >= 6 && roll < 0.10) return 'red';
    if (phase >= 4 && roll < 0.25) return 'gold';
    if (phase >= 2 && roll < 0.50) return 'purple';
    return 'normal';
}