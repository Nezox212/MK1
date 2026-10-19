(() => {

    /* ---------- звуки ---------- */
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function beep({ freq = 600, endFreq = 300, duration = 0.12, type = 'square', volume = 0.08 } = {}) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    /* ---------- модалка ---------- */
    const cards = [...document.querySelectorAll('.kameo')];
    const modal = document.getElementById('kameoModal');
    const nameEl = modal.querySelector('.fm__name');
    const content = modal.querySelector('.fm__content');
    const tabs = modal.querySelectorAll('.fm__tab');

    let current = 0;
    let currentTab = 'info';

    function renderContent() {
        const card = cards[current];
        const data = cameos[card.id] || {};

        if (currentTab === 'info') {
            content.innerHTML = data.info
                ? `<p>${data.info}</p>`
                : `<p class="fm__empty">Информация скоро появится.</p>`;
        }

        if (currentTab === 'move') {
            content.innerHTML = data.move
                ? `<p>${data.move}</p>`
                : `<p class="fm__empty">Описание приёма скоро появится.</p>`;
        }

        if (currentTab === 'video') {
            const v = data.video;
            content.innerHTML = cameoVideo && v && v.end > v.start
                ? `<iframe class="fm__video"
                       src="https://www.youtube.com/embed/${cameoVideo}?start=${v.start}&end=${v.end}&autoplay=1&rel=0"
                       referrerpolicy="strict-origin-when-cross-origin"
                       allow="autoplay; encrypted-media"
                       allowfullscreen></iframe>`
                : `<p class="fm__empty">Видео скоро появится.</p>`;
        }
    }

    function render() {
        const card = cards[current];
        const data = cameos[card.id] || {};

        modal.style.setProperty('--color', getComputedStyle(card).getPropertyValue('--color'));
        modal.style.setProperty('--img', card.style.getPropertyValue('--img'));
        nameEl.textContent = data.name || card.textContent.trim();

        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === currentTab));
        renderContent();
    }

    function openModal(index) {
        current = index;
        currentTab = 'info';
        render();
        modal.classList.add('open');
        document.body.classList.add('no-scroll');
        beep({ freq: 200, endFreq: 60, duration: 0.25, type: 'sawtooth', volume: 0.12 });
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.classList.remove('no-scroll');
        content.innerHTML = '';
    }

    function step(dir) {
        current = (current + dir + cards.length) % cards.length;
        currentTab = 'info';
        render();
    }

    cards.forEach((card, i) => {
        card.addEventListener('mouseenter', () => beep({ freq: 700, endFreq: 400, duration: 0.08, type: 'triangle' }));
        card.addEventListener('click', () => openModal(i));
    });

    tabs.forEach(tab => tab.addEventListener('click', () => {
        currentTab = tab.dataset.tab;
        render();
    }));

    modal.querySelector('.fm__close').addEventListener('click', closeModal);
    modal.querySelector('.fm__prev').addEventListener('click', () => step(-1));
    modal.querySelector('.fm__next').addEventListener('click', () => step(1));

    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    document.addEventListener('keydown', e => {
        if (!modal.classList.contains('open')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
    });

})();