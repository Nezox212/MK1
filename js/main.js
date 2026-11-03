(() => {
    const pick = list => list[Math.floor(Math.random() * list.length)];

    const shorten = (text = '', max = 160) => {
        if (text.length <= max) return text;
        return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
    };

    const render = (el, item, tag, link) => {
        el.style.setProperty('--color', item.color);
        el.style.setProperty('--img', `url('${item.img}')`);
        el.innerHTML = `
<div class="rcard__img" style="background-image: url('${item.img}')"></div>
<div class="rcard__body">
    <div class="rcard__tag">${tag}</div>
    <h3 class="rcard__name">${item.name}</h3>
    <p class="rcard__text">${shorten(item.info)}</p>
    <a class="rcard__link" href="${link}?search=${encodeURIComponent(item.name)}">Подробнее</a>
</div>`;
    };

    window.dataReady.then(({ fighterList, cameoList }) => {
        const fEl = document.getElementById('rFighter');
        const cEl = document.getElementById('rCameo');
        const rollBtn = document.getElementById('rollBtn');

        const roll = () => {
            render(fEl, pick(fighterList), 'Боец', 'html/character.html');
            render(cEl, pick(cameoList), 'Камео', 'html/kameo.html');
        };

        roll();

        rollBtn.addEventListener('click', () => {
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

    const beep = ({ freq = 600, endFreq = 300, duration = 0.12, type = 'square', volume = 0.08 } = {}) => {
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
    };

    const save = (key, value) => { try { localStorage.setItem(key, value); } catch (e) {} };
    const load = key => { try { return localStorage.getItem(key); } catch (e) { return null; } };

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

    const nextRound = () => {
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
            btn.textContent = o.name;
            btn.addEventListener('click', () => answer(o, btn));
            silOpts.appendChild(btn);
        });
    };

    const answer = (option, btn) => {
        if (locked) return;
        locked = true;

        if (option.id === target.id) {
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
                if (b.textContent === target.name) b.classList.add('right');
            });
        }

        [...silOpts.children].forEach(b => (b.disabled = true));
        silImg.classList.add('revealed');
        silBox.classList.add('done');
        silScoreEl.textContent = score;
        silStreakEl.textContent = streak;
        silBestEl.textContent = best;
        silNext.hidden = false;
    };

    silNext.addEventListener('click', nextRound);

    dataReady
        .then(({ fighterList }) => {
            pool = fighterList;
            if (pool.length >= 4) nextRound();
            else silOpts.textContent = 'Не удалось загрузить бойцов.';
        })
        .catch(err => {
            console.error('Угадай бойца:', err);
            silOpts.textContent = 'Не удалось загрузить бойцов.';
        });

    const GOAL = 80;
    const TIME = 10;
    const GAIN = 10;
    const PENALTY = 3;
    const DECAY = 5;
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

    const newKey = () => {
        let next;
        do { next = KEYS[Math.floor(Math.random() * KEYS.length)]; }
        while (next === targetKey);
        targetKey = next;
        mKey.textContent = next.replace('Key', '');
    };

    const draw = () => {
        mFill.style.width = `${power}%`;
        mPct.textContent = `${Math.round(power)}%`;
        mTimer.textContent = Math.max(0, timeLeft).toFixed(1);
        mBar.classList.toggle('ready', power >= GOAL);
    };

    const setMsg = (text, cls = '') => {
        mMsg.textContent = text;
        mMsg.className = `might__msg ${cls}`;
    };

    const startMight = () => {
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
    };

    const tick = now => {
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
    };

    const press = code => {
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
    };

    const strike = () => {
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
    };

    const endMight = (win, text) => {
        running = false;
        cancelAnimationFrame(raf);
        setMsg(text, win ? 'win' : 'lose');
        mHit.hidden = true;
        mStart.hidden = false;
        mStart.textContent = 'Ещё раз';
        mKey.textContent = '?';
        if (win) beep({ freq: 120, endFreq: 40, duration: 0.5, type: 'sawtooth', volume: 0.2 });
        else beep({ freq: 200, endFreq: 70, duration: 0.3, type: 'sawtooth', volume: 0.12 });
    };

    const stopMight = () => {
        if (!running) return;
        running = false;
        cancelAnimationFrame(raf);
        mHit.hidden = true;
        mStart.hidden = false;
        mKey.textContent = '?';
        setMsg('');
    };

    mStart.addEventListener('click', startMight);
    mHit.addEventListener('click', () => {
        strike();
        mHit.blur();
    });

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
    });
})();