const PARTICLE_CONTAINER = document.getElementById('target-layer');

function spawnParticles(x, y, count, color, speed = 3) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = 3 + Math.random() * 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = color;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.boxShadow = `0 0 ${size}px ${color}`;

        const angle = Math.random() * Math.PI * 2;
        const velocity = 1 + Math.random() * speed;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        const life = 400 + Math.random() * 400;

        PARTICLE_CONTAINER.appendChild(particle);

        let startTime = Date.now();
        function animateParticle() {
            const elapsed = Date.now() - startTime;
            if (elapsed >= life) {
                particle.remove();
                return;
            }
            const progress = elapsed / life;
            const cx = parseFloat(particle.style.left);
            const cy = parseFloat(particle.style.top);
            particle.style.left = `${cx + vx}px`;
            particle.style.top = `${cy + vy + 0.15}px`;
            particle.style.opacity = 1 - progress;
            particle.style.transform = `scale(${1 - progress * 0.5})`;
            requestAnimationFrame(animateParticle);
        }

        requestAnimationFrame(animateParticle);
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
    setTimeout(() => spawnParticles(x, y, 10, '#ff6b6b', 4), 100);
}