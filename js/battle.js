(() => {
    const DIFFICULTY = {
        easy:   { interval: 2500, dmg: [10, 20], dodgeChance: 0.5, dodgeWindow: 1000 }, // ~15 секунд
        normal: { interval: 2000, dmg: [15, 25], dodgeChance: 0.35, dodgeWindow: 750 }, // ~10 секунд
        hard:   { interval: 1500, dmg: [20, 30], dodgeChance: 0.2, dodgeWindow: 500 }   // ~6Cекунд
    };

    const WINS_NEEDED = 2;
    const ASSIST_CHANCE = 0.1;
    const ASSIST_DMG = [5, 10];
    const FATAL_LIMIT = 25;
    const FATAL_DMG = 35;
    const FATAL_WINDOW = 3000;
    const STUN_MS = 2000;

    const LEFT = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
    const RIGHT = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
    const CHORD_KEYS = [...LEFT, ...RIGHT];
    const DODGE_KEYS = ['KeyQ', 'KeyE', 'KeyR', 'KeyF'];
    const LABEL = {
        KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D',
        ArrowUp: '↑', ArrowLeft: '←', ArrowDown: '↓', ArrowRight: '→',
        KeyQ: 'Q', KeyE: 'E', KeyR: 'R', KeyF: 'F'
    };

    const $ = id => document.getElementById(id);
    const gameBox = $('gameBattle');
    if (!gameBox) return;

    const bSetup = $('bSetup');
    const bArena = $('bArena');
    const bFighters = $('bFighters');
    const bCameos = $('bCameos');
    const bStart = $('bStart');
    const bMe = $('bMe');
    const bBot = $('bBot');
    const bMePortrait = $('bMePortrait');
    const bBotPortrait = $('bBotPortrait');
    const bMeName = $('bMeName');
    const bBotName = $('bBotName');
    const bMeHp = $('bMeHp');
    const bBotHp = $('bBotHp');
    const bMeFill = $('bMeFill');
    const bBotFill = $('bBotFill');
    const bMeTxt = $('bMeTxt');
    const bBotTxt = $('bBotTxt');
    const bMeWins = $('bMeWins');
    const bBotWins = $('bBotWins');
    const bRound = $('bRound');
    const bStrike = $('bStrike');
    const bStrikeFill = $('bStrikeFill');
    const bStrikeTxt = $('bStrikeTxt');
    const bFatal = $('bFatal');
    const bKeys = $('bKeys');
    const bDodge = $('bDodge');
    const bDodgeKey = $('bDodgeKey');
    const bMsg = $('bMsg');
    const bCameo = $('bCameo');
    const bCameoImg = $('bCameoImg');
    const bCount = $('bCount');
    const bEnd = $('bEnd');
    const bEndTitle = $('bEndTitle');
    const bEndSub = $('bEndSub');

    const battleEl = gameBox.querySelector('.battle');

    const enter = () => {
        document.body.classList.add('in-battle', 'no-scroll');
        battleEl.classList.add('full');
        if (!document.fullscreenElement && battleEl.requestFullscreen) {
            battleEl.requestFullscreen().catch(() => {});
        }
    };

    const leave = () => {
        document.body.classList.remove('in-battle', 'no-scroll');
        battleEl.classList.remove('full');
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    };

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

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const rand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
    const shuffle = list => [...list].sort(() => Math.random() - 0.5);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    const defaultStats = { w: 0, l: 0, bestTime: 0, streak: 0, bestStreak: 0 };
    const loadStats = () => {
        try {
            return { ...defaultStats, ...JSON.parse(localStorage.getItem('battleStats')) };
        } catch (e) {
            return { ...defaultStats };
        }
    };
    const saveStats = s => {
        try { localStorage.setItem('battleStats', JSON.stringify(s)); } catch (e) {}
    };
    let stats = loadStats();

    const drawStats = () => {
        $('bW').textContent = stats.w;
        $('bL').textContent = stats.l;
        $('bT').textContent = stats.bestTime ? `${stats.bestTime.toFixed(1)} с` : '—';
        $('bS').textContent = stats.bestStreak;
    };
    drawStats();

    const pressed = new Set();
    const picked = { fighter: null, cameo: null };
    let fighterPool = [];
    let diffKey = 'easy';
    let runId = 0;
    let st = null;
    let msgTimer = 0;

    const flash = el => {
        el.classList.remove('hit');
        void el.offsetWidth;
        el.classList.add('hit');
    };

    const setMsg = (text, cls = '') => {
        bMsg.textContent = text;
        bMsg.className = `b-msg ${cls}`;
        clearTimeout(msgTimer);
        msgTimer = setTimeout(() => { bMsg.textContent = ''; }, 1300);
    };

    const buildPick = (box, list, key) => {
        box.innerHTML = '';
        list.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'b-card';
            btn.title = item.name;
            btn.style.setProperty('--color', item.color);
            btn.style.backgroundImage = `url('${item.img}')`;
            btn.innerHTML = `<span>${item.name}</span>`;
            btn.addEventListener('click', () => {
                picked[key] = item;
                box.querySelectorAll('.b-card').forEach(c => c.classList.toggle('selected', c === btn));
                bStart.disabled = !(picked.fighter && picked.cameo);
            });
            box.appendChild(btn);
        });
    };

    $('bDiff').addEventListener('click', e => {
        const btn = e.target.closest('.bdiff');
        if (!btn) return;
        diffKey = btn.dataset.diff;
        document.querySelectorAll('.bdiff').forEach(b => b.classList.toggle('active', b === btn));
    });

    const newChord = () => {
        const r = Math.random();
        const n = r < 0.25 ? 1 : r < 0.9 ? 2 : 3;
        const free = CHORD_KEYS.filter(k => !st.spent.has(k));
        let keys;
        if (n === 3) {
            const twoLeft = Math.random() < 0.5;
            const a = shuffle(free.filter(k => (twoLeft ? LEFT : RIGHT).includes(k)));
            const b = shuffle(free.filter(k => (twoLeft ? RIGHT : LEFT).includes(k)));
            keys = a.length >= 2 && b.length >= 1 ? [...a.slice(0, 2), b[0]] : shuffle(free).slice(0, 3);
        } else {
            keys = shuffle(free).slice(0, n);
        }
        const dmg = n === 1 ? rand(5, 10) : n === 2 ? rand(10, 20) : 25;
        return { keys, dmg };
    };

    const markKeys = () => {
        bArena.querySelectorAll('.key[data-code]').forEach(el => {
            el.classList.toggle('down', pressed.has(el.dataset.code));
        });
    };

    const renderChord = () => {
        bKeys.innerHTML = st.chord.keys
            .map(k => `<span class="key" data-code="${k}">${LABEL[k]}</span>`)
            .join('<em>+</em>');
        markKeys();
    };

    const drawWins = () => {
        [...bMeWins.children].forEach((el, i) => el.classList.toggle('on', i < st.rounds.me));
        [...bBotWins.children].forEach((el, i) => el.classList.toggle('on', i < st.rounds.bot));
    };

    const draw = now => {
        const s = st;
        bMeFill.style.width = `${s.hp.me}%`;
        bBotFill.style.width = `${s.hp.bot}%`;
        bMeTxt.textContent = `${Math.ceil(s.hp.me)}%`;
        bBotTxt.textContent = `${Math.ceil(s.hp.bot)}%`;
        bMeHp.classList.toggle('fatal', s.hp.me > 0 && s.hp.me < FATAL_LIMIT);

        const stunned = now < s.stunUntil;
        const start = s.strikeAt - s.diff.interval;
        const p = clamp((now - start) / s.diff.interval, 0, 1);
        bStrikeFill.style.width = `${p * 100}%`;
        bStrike.classList.toggle('stun', stunned);
        bStrikeTxt.textContent = stunned ? 'STUN' : 'Удар бота';

        bFatal.hidden = !s.fatal.active;
        bDodge.hidden = !s.dodge;
        if (s.dodge) {
            bDodgeKey.textContent = LABEL[s.dodge.key];
            bDodgeKey.dataset.code = s.dodge.key;
        }
    };

    const pickDodgeKey = () => {
        const pool = st.fatal.active ? ['KeyR', 'KeyF'] : DODGE_KEYS;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const damageBot = (amount, text) => {
        st.hp.bot = Math.max(0, st.hp.bot - amount);
        flash(bBotPortrait);
        setMsg(text, 'good');
        beep({ freq: 220, endFreq: 90, duration: 0.12, type: 'square', volume: 0.1 });
        if (st.hp.bot <= 0) endRound('me');
    };

    const hit = () => {
        const { keys, dmg } = st.chord;
        CHORD_KEYS.forEach(k => { if (pressed.has(k)) st.spent.add(k); });
        keys.forEach(k => st.spent.add(k));
        st.chord = newChord();
        renderChord();
        damageBot(dmg, `Удар -${dmg}%`);
    };

    const checkChord = () => {
        if (!st || !st.running) return;
        const held = CHORD_KEYS.filter(k => pressed.has(k) && !st.spent.has(k));
        const need = st.chord.keys;
        if (held.length === need.length && need.every(k => held.includes(k))) hit();
    };

    const fatalHit = () => {
        st.fatal.active = false;
        st.fatal.used = true;
        damageBot(FATAL_DMG, `FATAL BLOW! -${FATAL_DMG}%`);
    };

    const dodgeOk = () => {
        const now = performance.now();
        st.dodge = null;
        st.stunUntil = now + STUN_MS;
        st.strikeAt = st.stunUntil + st.diff.interval;
        st.dodgeRolled = false;
        setMsg('DODGE! Бот оглушён', 'info');
        beep({ freq: 400, endFreq: 900, duration: 0.15, type: 'triangle', volume: 0.12 });
    };

    const assist = () => {
        const amount = rand(...ASSIST_DMG);
        bCameo.classList.remove('show');
        void bCameo.offsetWidth;
        bCameo.classList.add('show');
        damageBot(amount, `${st.cameo.name}: -${amount}%`);
    };

    const botStrike = now => {
        st.dodge = null;
        const dmg = rand(...st.diff.dmg);
        st.hp.me = Math.max(0, st.hp.me - dmg);
        flash(bMePortrait);
        setMsg(`Бот бьёт: -${dmg}%`, 'bad');
        beep({ freq: 160, endFreq: 60, duration: 0.2, type: 'sawtooth', volume: 0.14 });
        st.strikeAt = now + st.diff.interval;
        st.dodgeRolled = false;
        if (st.hp.me <= 0) endRound('bot');
    };

    const tick = () => {
        if (!st || !st.running) return;
        const now = performance.now();

        if (now - st.lastAssist >= 1000) {
            st.lastAssist = now;
            if (Math.random() < ASSIST_CHANCE) assist();
            if (!st.running) return;
        }

        if (!st.fatal.used && !st.fatal.active && st.hp.me < FATAL_LIMIT) {
            st.fatal.active = true;
            st.fatal.until = now + FATAL_WINDOW;
            if (st.dodge && (st.dodge.key === 'KeyQ' || st.dodge.key === 'KeyE')) {
                st.dodge.key = pickDodgeKey();
            }
            setMsg('FATAL BLOW: Q + E!', 'bad');
            beep({ freq: 100, endFreq: 300, duration: 0.3, type: 'sawtooth', volume: 0.14 });
        }
        if (st.fatal.active && now > st.fatal.until) {
            st.fatal.active = false;
            st.fatal.used = true;
            setMsg('FATAL BLOW упущен', 'bad');
        }

        const left = st.strikeAt - now;
        if (!st.dodgeRolled && left <= st.diff.dodgeWindow) {
            st.dodgeRolled = true;
            if (Math.random() < st.diff.dodgeChance) st.dodge = { key: pickDodgeKey() };
        }
        if (left <= 0) {
            botStrike(now);
            if (!st.running) return;
        }

        draw(now);
        st.raf = requestAnimationFrame(tick);
    };

    const finishMatch = youWon => {
        const s = st;
        const time = s.fightMs / 1000;
        if (youWon) {
            stats.w++;
            stats.streak++;
            stats.bestStreak = Math.max(stats.bestStreak, stats.streak);
            if (!stats.bestTime || time < stats.bestTime) stats.bestTime = time;
        } else {
            stats.l++;
            stats.streak = 0;
        }
        saveStats(stats);
        drawStats();
        bCount.hidden = true;
        bEndTitle.textContent = youWon ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ';
        bEndTitle.className = `b-end__title ${youWon ? 'win' : 'lose'}`;
        bEndSub.textContent = `Счёт ${s.rounds.me}:${s.rounds.bot} · время боя ${time.toFixed(1)} с`;
        bEnd.hidden = false;
        beep(youWon
            ? { freq: 300, endFreq: 900, duration: 0.5, type: 'triangle', volume: 0.15 }
            : { freq: 200, endFreq: 40, duration: 0.6, type: 'sawtooth', volume: 0.15 });
    };

    const endRound = async winner => {
        const s = st;
        const id = s.id;
        s.running = false;
        cancelAnimationFrame(s.raf);
        s.fightMs += performance.now() - s.roundStart;
        s.dodge = null;
        s.fatal.active = false;
        s.rounds[winner]++;
        draw(performance.now());
        drawWins();

        const youWon = winner === 'me';
        bCount.textContent = youWon ? 'РАУНД ВЫИГРАН' : 'РАУНД ПРОИГРАН';
        bCount.hidden = false;
        beep({ freq: 150, endFreq: 50, duration: 0.4, type: 'sawtooth', volume: 0.15 });

        if (s.rounds[winner] >= WINS_NEEDED) {
            await delay(1200);
            if (id !== runId) return;
            finishMatch(youWon);
            return;
        }
        await delay(1800);
        if (id !== runId) return;
        startRound(id);
    };

    const startRound = async id => {
        const s = st;
        s.round++;
        s.hp = { me: 100, bot: 100 };
        s.fatal = { active: false, used: false, until: 0 };
        s.dodge = null;
        s.running = false;
        s.spent = new Set();
        CHORD_KEYS.forEach(k => { if (pressed.has(k)) s.spent.add(k); });
        s.chord = newChord();
        s.stunUntil = 0;
        s.strikeAt = performance.now() + s.diff.interval;
        bRound.textContent = `РАУНД ${s.round}`;
        renderChord();
        drawWins();
        draw(performance.now());

        const steps = [[`РАУНД ${s.round}`, 1000], ['3', 700], ['2', 700], ['1', 700], ['FIGHT!', 600]];
        for (const [text, ms] of steps) {
            bCount.textContent = text;
            bCount.hidden = false;
            beep({ freq: text === 'FIGHT!' ? 700 : 400, endFreq: text === 'FIGHT!' ? 300 : 350, duration: 0.15, type: 'square', volume: 0.1 });
            await delay(ms);
            if (id !== runId) return;
        }
        bCount.hidden = true;

        const now = performance.now();
        s.running = true;
        s.roundStart = now;
        s.lastAssist = now;
        s.strikeAt = now + s.diff.interval;
        s.stunUntil = 0;
        s.dodgeRolled = false;
        s.raf = requestAnimationFrame(tick);
    };

    const setSide = (portrait, nameEl, item) => {
        portrait.style.backgroundImage = `url('${item.img}')`;
        portrait.parentElement.style.setProperty('--color', item.color);
        nameEl.textContent = item.name;
    };

    const newMatch = () => {
        runId++;
        if (st) cancelAnimationFrame(st.raf);
        const others = fighterPool.filter(f => f.id !== picked.fighter.id);
        const bot = others[Math.floor(Math.random() * others.length)];

        st = {
            id: runId,
            me: picked.fighter,
            bot,
            cameo: picked.cameo,
            diff: DIFFICULTY[diffKey],
            rounds: { me: 0, bot: 0 },
            round: 0,
            fightMs: 0,
            running: false,
            spent: new Set()
        };

        setSide(bMePortrait, bMeName, st.me);
        setSide(bBotPortrait, bBotName, st.bot);
        bCameo.style.setProperty('--color', st.cameo.color);
        bCameoImg.style.backgroundImage = `url('${st.cameo.img}')`;

        bSetup.hidden = true;
        bArena.hidden = false;
        enter();
        bEnd.hidden = true;
        bMsg.textContent = '';
        startRound(runId);
    };

    const showSetup = () => {
        runId++;
        if (st) cancelAnimationFrame(st.raf);
        st = null;
        bArena.hidden = true;
        bEnd.hidden = true;
        bCount.hidden = true;
        bSetup.hidden = false;
        leave();
    };

    bStart.addEventListener('click', newMatch);
    $('bAgain').addEventListener('click', newMatch);
    $('bBack').addEventListener('click', showSetup);

    document.querySelectorAll('.gtab').forEach(tab => {
        tab.addEventListener('click', () => {
            const on = tab.dataset.game === 'battle';
            gameBox.hidden = !on;
            if (!on) showSetup();
        });
    });

    document.addEventListener('keydown', e => {
        const c = e.code;
        if (st && c.startsWith('Arrow')) e.preventDefault();
        if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        pressed.add(c);
        if (!st || !st.running) {
            if (st) markKeys();
            return;
        }
        if (st.dodge && c === st.dodge.key) dodgeOk();
        if (st.fatal.active && (c === 'KeyQ' || c === 'KeyE') && pressed.has('KeyQ') && pressed.has('KeyE')) {
            fatalHit();
        }
        checkChord();
        markKeys();
    });

    document.addEventListener('keyup', e => {
        pressed.delete(e.code);
        if (!st) return;
        st.spent.delete(e.code);
        checkChord();
        markKeys();
    });

    window.addEventListener('blur', () => {
        pressed.clear();
        if (st) {
            st.spent.clear();
            markKeys();
        }
    });
    $('bExit').addEventListener('click', showSetup);

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && st) showSetup();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && st) showSetup();
    });
    dataReady
        .then(({ fighterList, cameoList }) => {
            fighterPool = fighterList;
            buildPick(bFighters, fighterList, 'fighter');
            buildPick(bCameos, cameoList, 'cameo');
        })
        .catch(err => console.error('Битва:', err));
})();