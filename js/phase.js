let currentPhase = 1;
let score = 0;
let lastUpgradePhase = 0;

const CHOICE_MODAL = document.getElementById('choice-modal');
const CHOICE_OPTIONS = document.getElementById('choice-options');

const UPGRADES = [
    { id: 1, name: '攻撃力UP', desc: '与ダメージ+25%' },
    { id: 2, name: 'クリティカル', desc: '10%の確率で3倍ダメージ（重ねると段階的強化）' },
    { id: 3, name: 'コンボ倍率UP', desc: 'コンボ倍率ベース+0.1（取得は1回のみ）' },
    { id: 4, name: 'ターゲット拡大', desc: 'ターゲットの半径+15%（取得は2回まで）' },
    { id: 5, name: '余裕UP', desc: 'ターゲットが消えるまでの時間+20%（取得は2回まで）' },
    { id: 6, name: 'スコアブースト', desc: '獲得スコア+30%' },
    { id: 7, name: 'コンボセーフ', desc: 'ミス時のコンボ減少を3軽減（重ねると軽減量増加）' },
    { id: 8, name: 'チェイン', desc: '5コンボ達成ごとに250ポイント（Perfect時のみ）（取得は1回のみ）' },
    { id: 9, name: 'ラッキー', desc: '10%の確率でフェーズ×100の追加ダメージ（取得は1回のみ）' },
    { id: 10, name: 'フィニッシャー', desc: 'フェーズクリア時にフェーズ×15スコア加算' },
    { id: 11, name: '連撃', desc: '15%の確率でダメージ2倍（重ねると段階的強化）' },
    { id: 12, name: '吸収', desc: '敵撃破時に+200スコア（取得は1回のみ）' },
    { id: 13, name: 'エコー', desc: '20%の確率で100%追加ダメージ（取得は2回まで）' },
    { id: 14, name: '障壁', desc: 'ミスを1回無効化（使い切り、重ねると回数増加）' },
    { id: 15, name: 'オーラ', desc: '10コンボごとに+1.5（例:30コンボで+4.5）' }
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
            addLog(`吸収ボーナス +${bonus}`);
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
    document.querySelector('.choice-header').textContent = '選択肢';
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
    header.textContent = 'ボス撃破! 2つ選べ';
    choices.forEach((choice) => {
        const option = document.createElement('div');
        option.className = 'choice-option' + (isLucky ? ' choice-lucky' : '');
        option.innerHTML = `
            <div class="choice-option-name">${isLucky ? '⭐ ' : ''}${choice.name}${isLucky ? ' (×1.5)' : ''}</div>
            <div class="choice-option-desc">${choice.desc}</div>
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
                header.textContent = '選択肢';
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
            <div class="choice-option-name">${isLucky ? '⭐ ' : ''}${choice.name}${isLucky ? ' (×1.5)' : ''}</div>
            <div class="choice-option-desc">${choice.desc}</div>
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