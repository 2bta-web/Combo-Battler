let currentPhase = 1;
let score = 0;
let lastUpgradePhase = 0;

const CHOICE_MODAL = document.getElementById('choice-modal');
const CHOICE_OPTIONS = document.getElementById('choice-options');

const UPGRADES = [
    { id: 1, name: () => t('upgrade_attack'), desc: () => t('upgrade_attack_desc') },
    { id: 2, name: () => t('upgrade_crit'), desc: () => t('upgrade_crit_desc') },
    { id: 3, name: () => t('upgrade_combo'), desc: () => t('upgrade_combo_desc') },
    { id: 4, name: () => t('upgrade_size'), desc: () => t('upgrade_size_desc') },
    { id: 5, name: () => t('upgrade_time'), desc: () => t('upgrade_time_desc') },
    { id: 6, name: () => t('upgrade_score'), desc: () => t('upgrade_score_desc') },
    { id: 7, name: () => t('upgrade_safe'), desc: () => t('upgrade_safe_desc') },
    { id: 8, name: () => t('upgrade_chain'), desc: () => t('upgrade_chain_desc') },
    { id: 9, name: () => t('upgrade_lucky'), desc: () => t('upgrade_lucky_desc') },
    { id: 10, name: () => t('upgrade_finisher'), desc: () => t('upgrade_finisher_desc') },
    { id: 11, name: () => t('upgrade_ds'), desc: () => t('upgrade_ds_desc') },
    { id: 12, name: () => t('upgrade_absorb'), desc: () => t('upgrade_absorb_desc') },
    { id: 13, name: () => t('upgrade_echo'), desc: () => t('upgrade_echo_desc') },
    { id: 14, name: () => t('upgrade_barrier'), desc: () => t('upgrade_barrier_desc') },
    { id: 15, name: () => t('upgrade_aura'), desc: () => t('upgrade_aura_desc') }
];

function initPhase() {
    currentPhase = 1;
    score = 0;
    lastUpgradePhase = 0;
    setEnemyHP(getHPForPhase(1));
}

function getMaxPhase() {
    const mode = window.gameMode || 'standard';
    if (mode === 'endless') return Infinity;
    return 10;
}

function getHPForPhase(phase) {
    const mode = window.gameMode || 'standard';
    if (mode === 'hard') return 80 + (phase - 1) * 40;
    if (mode === 'endless') return 60 + (phase - 1) * 20;
    return 60 + (phase - 1) * 35;
}

function getUpgradeInterval() {
    const mode = window.gameMode || 'standard';
    return mode === 'endless' ? 3 : 1;
}

function shouldOfferUpgrade() {
    return getUpgradeInterval() === 1 || (currentPhase - lastUpgradePhase) >= getUpgradeInterval();
}

function nextPhase() {
    currentPhase++;
    if (getAbsorbBonus) {
        const bonus = getAbsorbBonus();
        if (bonus > 0) {
            addScore(bonus);
            if (typeof scoreBreakdown !== 'undefined') scoreBreakdown.absorb += bonus;
            addLog(tf('log_absorb', bonus));
        }
    }
}

function getPhase() {
    return currentPhase;
}

function isBossPhase(phase) {
    if (window.gameMode === 'endless') return phase % 10 === 0;
    return phase === 10;
}

function getPhaseCount() {
    const max = getMaxPhase();
    return max === Infinity ? '∞' : max;
}

function showChoices() {
    document.querySelector('.choice-header').textContent = t('choice_header');
    const choices = getRandomChoices(3);
    const isLucky = Math.random() < 0.1;
    renderChoiceModal(choices, isLucky);
    CHOICE_MODAL.classList.remove('hidden');
    playChoicesAppearSound();
}

function getRandomChoices(count) {
    const available = UPGRADES.filter(u => isUpgradeAvailable(u.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function showBossChoices() {
    const choices = getRandomChoices(5);
    if (choices.length < 2) {
        if (choices.length === 1) applyUpgrade(choices[0].id, 1);
        if (window.onChoiceSelected) window.onChoiceSelected();
        return;
    }
    const isLucky = Math.random() < 0.1;
    let bossPickCount = 0;
    let selectedChoices = [];
    CHOICE_OPTIONS.innerHTML = '';
    const header = document.querySelector('.choice-header');
    header.textContent = t('boss_choice_header');
    choices.forEach((choice) => {
        const option = document.createElement('div');
        option.className = 'choice-option' + (isLucky ? ' choice-lucky' : '');
        option.innerHTML = `
            <div class="choice-option-name">${isLucky ? '⭐ ' : ''}${choice.name()}${isLucky ? ' (×1.5)' : ''}</div>
            <div class="choice-option-desc">${choice.desc()}</div>
        `;
        const mult = isLucky ? 1.5 : 1;
        option.addEventListener('click', () => {
            if (option.style.opacity === '0.5') {
                option.style.opacity = '';
                selectedChoices = selectedChoices.filter(c => c !== choice.id);
                bossPickCount--;
                return;
            }
            selectedChoices.push(choice.id);
            option.style.opacity = '0.5';
            bossPickCount++;
            if (bossPickCount === 1) playSelectSound();
            if (bossPickCount >= 2) {
                selectedChoices.forEach(id => applyUpgrade(id, mult));
                CHOICE_MODAL.classList.add('hidden');
                bossPickCount = 0;
                selectedChoices = [];
                header.textContent = t('choice_header');
                if (window.onChoiceSelected) window.onChoiceSelected();
            }
        });
        CHOICE_OPTIONS.appendChild(option);
    });
    CHOICE_MODAL.classList.remove('hidden');
    playChoicesAppearSound();
}

function isUpgradeAvailable(id) {
    if (id === 3 && (getComboMultiplierUp && getComboMultiplierUp() > 0)) return false;
    if (id === 4 && (getTargetSizeBonus && getTargetSizeBonus() >= 0.30)) return false;
    if (id === 5 && (getSpawnTimeBonus && getSpawnTimeBonus() >= 0.40)) return false;
    if (id === 8 && (getChainAmount && getChainAmount() > 0)) return false;
    if (id === 9 && (getLuckyChance && getLuckyChance() > 0)) return false;
    if (id === 12 && (getAbsorbBonus && getAbsorbBonus() > 0)) return false;
    if (id === 13 && (getEchoRate && getEchoRate() >= 0.40)) return false;
    return true;
}

function renderChoiceModal(choices, isLucky) {
    CHOICE_OPTIONS.innerHTML = '';
    choices.forEach((choice, index) => {
        const option = document.createElement('div');
        option.className = 'choice-option' + (isLucky ? ' choice-lucky' : '');
        option.innerHTML = `
            <div class="choice-option-name">${isLucky ? '⭐ ' : ''}${choice.name()}${isLucky ? ' (×1.5)' : ''}</div>
            <div class="choice-option-desc">${choice.desc()}</div>
        `;
        option.addEventListener('click', () => {
            applyUpgrade(choice.id, isLucky ? 1.5 : 1);
            CHOICE_MODAL.classList.add('hidden');
            if (window.onChoiceSelected) window.onChoiceSelected(index);
        });
        CHOICE_OPTIONS.appendChild(option);
    });
}

function getScore() { return score; }
function addScore(amount) { score += amount; }