const modal = document.querySelector('.modal');
const modalFunc = () => {

        setInterval(() => {
            modal.classList.add("active");
        }, 50)

}
modalFunc();


const gmailInput = document.querySelector("#gmail_input");
const phoneInput = document.querySelector("#phone_input");
const modalBtn = document.querySelector(".modal_btn");
const result = document.querySelector(".result");

// example@gmail.com
const regexGmail = /^[a-z0-9.]{6,30}@gmail\.com$/i;

const regexPhone = /^\+996\d{9}$/;


phoneInput.oninput = () => {
    if (!phoneInput.value.startsWith("+996")) {
        phoneInput.value = "+996 ";
    }
};

modalBtn.onclick = () => {
    const cleanPhone = phoneInput.value.replace(/[\s-]/g, "");

    const isGmailValid = regexGmail.test(gmailInput.value.trim());
    const isPhoneValid = regexPhone.test(cleanPhone);
    const isValid = isGmailValid && isPhoneValid;

    result.textContent = isValid ? "good" : "bad";
    result.style.color = isValid ? "green" : "red";
};

modal.onclick = (event) => {
    if (event.target === modal) {
        modal.classList.remove('active');
    }
};

(() => {

    async function loadCards(htmlUrl, cssUrl, selector) {
        const [html, css] = await Promise.all([
            fetch(htmlUrl).then(r => r.text()),
            fetch(cssUrl).then(r => r.text())
        ]);

        const colors = {};
        for (const m of css.matchAll(/#([\w-]+)\s*\{\s*--color:\s*(#[0-9a-fA-F]{3,8})/g)) {
            colors[m[1]] = m[2];
        }

        const doc = new DOMParser().parseFromString(html, 'text/html');
        return [...doc.querySelectorAll(selector)].map(el => ({
            id: el.id,
            color: colors[el.id] || '#ffffff',
            img: (el.getAttribute('style').match(/url\(['"]?([^'")]+)/) || [])[1]
                ?.replace('../', '') || ''
        }));
    }

    function pick(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    function shorten(text = '', max = 160) {
        if (text.length <= max) return text;
        return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
    }

    function render(el, item, data, tag, link) {
        el.style.setProperty('--color', item.color);
        el.style.setProperty('--img', `url('${item.img}')`);
        el.innerHTML = `
<div class="rcard__img" style="background-image: url('${item.img}')"></div>        <div class="rcard__body">
            <div class="rcard__tag">${tag}</div>
            <h3 class="rcard__name">${data.name}</h3>
            <p class="rcard__text">${shorten(data.info)}</p>
            <a class="rcard__link" href="${link}">Подробнее</a>
        </div>`;
    }

    Promise.all([
        loadCards('html/character.html', 'css/character.css', '.fighter'),
        loadCards('html/kameo.html', 'css/cameo.css', '.kameo')
    ]).then(([fighterList, cameoList]) => {
        const fEl = document.getElementById('rFighter');
        const cEl = document.getElementById('rCameo');

        function roll() {
            const f = pick(fighterList.filter(x => fighters[x.id]));
            const c = pick(cameoList.filter(x => cameos[x.id]));
            render(fEl, f, fighters[f.id], 'Боец', 'html/character.html');
            render(cEl, c, cameos[c.id], 'Камео', 'html/cameo.html');
        }

        roll();

        document.getElementById('rollBtn').addEventListener('click', () => {
            fEl.classList.add('hide');
            cEl.classList.add('hide');
            setTimeout(() => {
                roll();
                fEl.classList.remove('hide');
                cEl.classList.remove('hide');
            }, 300);
        });
    }).catch(err => console.error('Случайный боец:', err));

})();



(() => {

    
    let audioCtx;
    function beep({ freq = 600, endFreq = 300, duration = 0.12, type = 'square', volume = 0.08 } = {}) {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(t + duration);
    }

    function save(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
    function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

    const pick = list => list[Math.floor(Math.random() * list.length)];
    const shuffle = list => [...list].sort(() => Math.random() - 0.5);

    let activeGame = 'sil';

    document.querySelectorAll('.gtab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeGame = tab.dataset.game;
            document.querySelectorAll('.gtab').forEach(t => t.classList.toggle('active', t === tab));
            document.getElementById('gameSil').hidden = activeGame !== 'sil';
            document.getElementById('gameMight').hidden = activeGame !== 'might';
            if (activeGame !== 'might') stopMight();
        });
    });

    /* ---------- игра 1: силуэт ---------- */
    const silBox = document.getElementById('silBox');
    const silImg = document.getElementById('silImg');
    const silOpts = document.getElementById('silOpts');
    const silNext = document.getElementById('silNext');
    const silScoreEl = document.getElementById('silScore');
    const silStreakEl = document.getElementById('silStreak');
    const silBestEl = document.getElementById('silBest');

    let pool = [];
    let target = null;
    let locked = false;
    let score = 0;
    let streak = 0;
    let best = Number(load('silBest')) || 0;
    silBestEl.textContent = best;

    async function loadPool() {
        const get = url => fetch(url).then(r => {
            if (!r.ok) throw new Error(`Не найден файл: ${url}`);
            return r.text();
        });
        const [html, css] = await Promise.all([get('html/character.html'), get('css/character.css')]);

        const colors = {};
        for (const m of css.matchAll(/#([\w-]+)\s*\{\s*--color:\s*(#[0-9a-fA-F]{3,8})/g)) {
            colors[m[1]] = m[2];
        }

        const doc = new DOMParser().parseFromString(html, 'text/html');
        return [...doc.querySelectorAll('.fighter')]
            .map(el => ({
                id: el.id,
                color: colors[el.id] || '#ffffff',
                img: ((el.getAttribute('style') || '').match(/url\(['"]?([^'")]+)/) || [])[1]
                    ?.replace('../', '') || ''
            }))
            .filter(x => x.img && fighters[x.id]);
    }

    function nextRound() {
        locked = false;
        silNext.hidden = true;
        silBox.classList.remove('done');

        silImg.style.transition = 'none';
        silImg.classList.remove('revealed');

        target = pick(pool);
        const others = shuffle(pool.filter(x => x.id !== target.id)).slice(0, 3);
        const options = shuffle([target, ...others]);

        silBox.style.setProperty('--color', target.color);
        silImg.style.backgroundImage = `url('${target.img}')`;

        silOpts.innerHTML = '';
        options.forEach(o => {
            const btn = document.createElement('button');
            btn.className = 'sil__opt';
            btn.textContent = fighters[o.id].name;
            btn.addEventListener('click', () => answer(o, btn));
            silOpts.appendChild(btn);
        });
    }

    function answer(option, btn) {
        if (locked) return;
        locked = true;

        const right = option.id === target.id;
        if (right) {
            score++;
            streak++;
            btn.classList.add('right');
            beep({ freq: 500, endFreq: 900, duration: 0.15, type: 'triangle', volume: 0.12 });
            if (streak > best) {
                best = streak;
                save('silBest', best);
            }
        } else {
            streak = 0;
            btn.classList.add('wrong');
            beep({ freq: 200, endFreq: 70, duration: 0.3, type: 'sawtooth', volume: 0.12 });
            [...silOpts.children].forEach(b => {
                if (b.textContent === fighters[target.id].name) b.classList.add('right');
            });
        }

        [...silOpts.children].forEach(b => (b.disabled = true));
        silImg.classList.add('revealed');
        silBox.classList.add('done');
        silScoreEl.textContent = score;
        silStreakEl.textContent = streak;
        silBestEl.textContent = best;
        silNext.hidden = false;
    }

    silNext.addEventListener('click', nextRound);

    loadPool()
        .then(list => {
            pool = list;
            if (pool.length >= 4) nextRound();
            else silOpts.textContent = 'Не удалось загрузить бойцов.';
        })
        .catch(err => {
            console.error('Угадай бойца:', err);
            silOpts.textContent = 'Не удалось загрузить бойцов.';
        });
    /* ---------- игра 2: Test Your Might ---------- */
    const GOAL = 80;      // нужный процент для удара
    const TIME = 10;      // секунд на игру
    const GAIN = 10;       // сколько % даёт верная кнопка
    const PENALTY = 3;    // сколько % отнимает неверная
    const DECAY = 5;     // на сколько % в секунду шкала падает сама
    const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyI', 'KeyJ', 'KeyK', 'KeyL'];

    const mFill = document.getElementById('mFill');
    const mPct = document.getElementById('mPct');
    const mTimer = document.getElementById('mTimer');
    const mMsg = document.getElementById('mMsg');
    const mStart = document.getElementById('mStart');
    const mHit = document.getElementById('mHit');
    const mBestEl = document.getElementById('mBest');
    const mBar = document.querySelector('.might__bar');
    const mKey = document.getElementById('mKey');

    let targetKey = '';
    let power = 0;
    let timeLeft = TIME;
    let running = false;
    let last = 0;
    let raf = 0;
    let bestHit = Number(load('mightBest')) || 0;
    if (bestHit) mBestEl.textContent = `${(TIME - bestHit).toFixed(1)} с`;

    function newKey() {
        let next;
        do { next = KEYS[Math.floor(Math.random() * KEYS.length)]; }
        while (next === targetKey);
        targetKey = next;
        mKey.textContent = next.replace('Key', '');
    }

    function draw() {
        mFill.style.width = `${power}%`;
        mPct.textContent = `${Math.round(power)}%`;
        mTimer.textContent = Math.max(0, timeLeft).toFixed(1);
        mBar.classList.toggle('ready', power >= GOAL);
    }

    function setMsg(text, cls = '') {
        mMsg.textContent = text;
        mMsg.className = `might__msg ${cls}`;
    }

    function startMight() {
        power = 0;
        timeLeft = TIME;
        running = true;
        last = performance.now();
        setMsg('Жми показанную кнопку!');
        mStart.hidden = true;
        mHit.hidden = false;
        mStart.blur();
        targetKey = '';
        newKey();
        draw();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
    }

    function tick(now) {
        if (!running) return;
        const dt = (now - last) / 1000;
        last = now;
        timeLeft -= dt;
        power = Math.max(0, power - DECAY * dt);
        draw();
        if (timeLeft <= 0) {
            timeLeft = 0;
            draw();
            endMight(false, 'Время вышло! Ты не успел ударить.');
            return;
        }
        raf = requestAnimationFrame(tick);
    }

    function press(code) {
        if (code === targetKey) {
            power = Math.min(100, power + GAIN);
            beep({ freq: 300 + power * 4, endFreq: 200 + power * 3, duration: 0.05, type: 'square', volume: 0.05 });
            newKey();
        } else {
            power = Math.max(0, power - PENALTY);
            beep({ freq: 140, endFreq: 90, duration: 0.1, type: 'sawtooth', volume: 0.08 });
            mKey.classList.add('bad');
            setTimeout(() => mKey.classList.remove('bad'), 120);
        }
        draw();
    }

    function strike() {
        if (!running) return;
        if (power >= GOAL) {
            const used = TIME - timeLeft;
            endMight(true, `УДАР! Мощность ${Math.round(power)}%, время ${used.toFixed(1)} с`);
            if (!bestHit || timeLeft > bestHit) {
                bestHit = timeLeft;
                save('mightBest', bestHit);
                mBestEl.textContent = `${used.toFixed(1)} с`;
            }
        } else {

            endMight(false, `Слишком рано! Мощность была всего ${Math.round(power)}%, нужно ${GOAL}%+`);
            mBar.classList.remove('shake');
            void mBar.offsetWidth;
            mBar.classList.add('shake');
        }
    }

    function endMight(win, text) {
        running = false;
        cancelAnimationFrame(raf);
        setMsg(text, win ? 'win' : 'lose');
        mHit.hidden = true;
        mStart.hidden = false;
        mStart.textContent = 'Ещё раз';
        mKey.textContent = '?';
        if (win) beep({ freq: 120, endFreq: 40, duration: 0.5, type: 'sawtooth', volume: 0.2 });
        else beep({ freq: 200, endFreq: 70, duration: 0.3, type: 'sawtooth', volume: 0.12 });
    }

    function stopMight() {
        if (!running) return;
        running = false;
        cancelAnimationFrame(raf);
        mHit.hidden = true;
        mStart.hidden = false;
        mKey.textContent = '?';
        setMsg('');
    }

    mStart.addEventListener('click', startMight);
    mHit.addEventListener('click', () => { strike(); mHit.blur(); });

    document.addEventListener('keydown', e => {
        if (!running || activeGame !== 'might') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (!e.repeat) strike();
            return;
        }
        if (KEYS.includes(e.code)) {
            e.preventDefault();
            if (!e.repeat) press(e.code);
        }
    });


    document.addEventListener('keyup', e => {
        if (running && e.code === 'Space') e.preventDefault();
    });})();