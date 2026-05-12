const PARTICLE_CONTAINER = document.getElementById('target-layer');

var particlePool = [];
var POOL_SIZE = 80;

function initParticlePool() {
    for (var i = 0; i < POOL_SIZE; i++) {
        var p = document.createElement('div');
        p.className = 'particle';
        p.style.display = 'none';
        PARTICLE_CONTAINER.appendChild(p);
        particlePool.push({ el: p, active: false, life: 0, startTime: 0, vx: 0, vy: 0 });
    }
}

function acquireParticle() {
    for (var i = 0; i < particlePool.length; i++) {
        if (!particlePool[i].active) return particlePool[i];
    }
    var oldest = particlePool[0];
    oldest.el.style.display = 'none';
    oldest.active = false;
    return oldest;
}

function spawnParticles(x, y, count, color, speed) {
    speed = speed || 3;
    for (var i = 0; i < count; i++) {
        var p = acquireParticle();
        var el = p.el;
        var size = 3 + Math.random() * 5;
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.background = color;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
        el.style.display = '';
        el.style.boxShadow = '0 0 ' + size + 'px ' + color;

        var angle = Math.random() * Math.PI * 2;
        var velocity = 1 + Math.random() * speed;
        p.vx = Math.cos(angle) * velocity;
        p.vy = Math.sin(angle) * velocity;
        p.life = 400 + Math.random() * 400;
        p.startTime = performance.now();
        p.active = true;
    }
}

function updateParticles() {
    var now = performance.now();
    for (var i = 0; i < particlePool.length; i++) {
        var p = particlePool[i];
        if (!p.active) continue;
        var elapsed = now - p.startTime;
        if (elapsed >= p.life) {
            p.el.style.display = 'none';
            p.active = false;
            continue;
        }
        var progress = elapsed / p.life;
        var cx = parseFloat(p.el.style.left) || 0;
        var cy = parseFloat(p.el.style.top) || 0;
        p.el.style.left = (cx + p.vx) + 'px';
        p.el.style.top = (cy + p.vy + 0.15) + 'px';
        p.el.style.opacity = 1 - progress;
        p.el.style.transform = 'scale(' + (1 - progress * 0.5) + ')';
    }
}

function spawnHitParticles(x, y) {
    spawnParticles(x, y, 8, '#64d2ff', 4);
}

function spawnPerfectParticles(x, y) {
    spawnParticles(x, y, 15, '#ffd700', 5);
}

function spawnMissParticles(x, y) {
    spawnParticles(x, y, 6, '#ff4444', 3);
}

function spawnComboParticles(x, y) {
    spawnParticles(x, y, 20, '#ffd700', 6);
    setTimeout(function() { spawnParticles(x, y, 10, '#ff6b6b', 4); }, 100);
}

initParticlePool();
