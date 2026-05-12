let maxHP = 100;
let currentHP = 100;

const ENEMY_BODY = document.getElementById('enemy-body');
const ENEMY_HP_FILL = document.getElementById('enemy-hp-fill');
const DAMAGE_POPUP_CONTAINER = document.getElementById('damage-popup-container');

function initEnemy() {
    clearBossMode();
    updateHPBar();
}

function damageEnemy(amount, isCritical = false) {
    currentHP = Math.max(0, currentHP - amount);
    updateHPBar();
    showDamagePopup(amount, isCritical);
    playHitAnimation();
}

function getEnemyHPPercent() {
    if (maxHP <= 0) return 0;
    return (currentHP / maxHP) * 100;
}

function updateHPBar() {
    const percent = getEnemyHPPercent();
    ENEMY_HP_FILL.style.width = percent + '%';
    var isBoss = !document.getElementById('boss-label').classList.contains('hidden');
    if (percent <= 25 && !isBoss) {
        ENEMY_HP_FILL.style.background = 'linear-gradient(90deg, #ff3333, #ff0000)';
        ENEMY_HP_FILL.classList.add('hp-critical');
    } else if (percent <= 50 && !isBoss) {
        ENEMY_HP_FILL.style.background = 'linear-gradient(90deg, #ff6b6b, #ff8e8e)';
        ENEMY_HP_FILL.classList.remove('hp-critical');
    } else if (!isBoss) {
        ENEMY_HP_FILL.style.background = '';
        ENEMY_HP_FILL.classList.remove('hp-critical');
    } else {
        ENEMY_HP_FILL.classList.remove('hp-critical');
    }
}

function showDamagePopup(amount, isCritical = false) {
    const popup = document.createElement('div');
    popup.className = 'damage-popup' + (isCritical ? ' critical' : '');
    popup.textContent = amount;
    popup.style.left = `${Math.random() * 40 - 20}px`;
    popup.style.top = '0px';
    DAMAGE_POPUP_CONTAINER.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

function playHitAnimation() {
    ENEMY_BODY.classList.remove('enemy-hit');
    ENEMY_BODY.classList.remove('hit-flash');
    void ENEMY_BODY.offsetWidth;
    ENEMY_BODY.classList.add('enemy-hit');
    ENEMY_BODY.classList.add('hit-flash');
    ENEMY_BODY.style.transform = 'scale(0.92)';
    setTimeout(function() {
        ENEMY_BODY.style.transform = '';
        ENEMY_BODY.classList.remove('enemy-hit');
        ENEMY_BODY.classList.remove('hit-flash');
    }, 150);
}

function setBossMode() {
    ENEMY_BODY.style.background = 'radial-gradient(circle at 30% 30%, #ffd700, #b8860b)';
    ENEMY_BODY.style.boxShadow = '0 0 40px rgba(255, 215, 0, 0.6), inset 0 -5px 15px rgba(0, 0, 0, 0.3)';
    ENEMY_HP_FILL.style.background = 'linear-gradient(90deg, #ffd700, #ff8c00)';
    document.getElementById('boss-label').classList.remove('hidden');
}

function clearBossMode() {
    ENEMY_BODY.style.background = '';
    ENEMY_BODY.style.boxShadow = '';
    ENEMY_HP_FILL.style.background = '';
    ENEMY_HP_FILL.classList.remove('hp-critical');
    document.getElementById('boss-label').classList.add('hidden');
}

function playDefeatAnimation() {
    ENEMY_BODY.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    ENEMY_BODY.style.transform = 'scale(1.3)';
    ENEMY_BODY.style.opacity = '0';
}

function setEnemyHP(hp) {
    currentHP = hp;
    maxHP = hp;
    ENEMY_BODY.style.transition = '';
    ENEMY_BODY.style.transform = '';
    ENEMY_BODY.style.opacity = '';
    updateHPBar();
}