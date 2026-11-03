const BASE = location.pathname.includes('/html/') ? '../' : '';

const fighters = {};
const cameos = {};
let fatalityVideo = '';
let cameoVideo = '';

const getJSON = async name => {
    const res = await fetch(`${BASE}json/${name}.json`);
    if (!res.ok) throw new Error(`${name}.json: HTTP ${res.status}`);
    return res.json();
};

const buildCards = (box, items, cls) => {
    box.innerHTML = items.map(i => `
<div class="${cls}" id="${i.id}" style="--img: url('${BASE}${i.img}')"><span>${i.name.toUpperCase()}</span></div>`).join('');
};

const dataReady = (async () => {
    try {
        const [f, c] = await Promise.all([getJSON('fighters'), getJSON('cameos')]);

        fatalityVideo = f.video;
        cameoVideo = c.video;
        f.items.forEach(i => { fighters[i.id] = i; });
        c.items.forEach(i => { cameos[i.id] = i; });

        const fighterBox = document.querySelector('.fighters');
        const cameoBox = document.querySelector('.kameos');
        if (fighterBox) buildCards(fighterBox, f.items, 'fighter');
        if (cameoBox) buildCards(cameoBox, c.items, 'kameo');

        return { fighterList: f.items, cameoList: c.items };
    } catch (err) {
        console.error('Загрузка данных:', err);
        throw err;
    }
})();