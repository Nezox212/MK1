
window.onYouTubeIframeAPIReady = initPlayer;


(function loadApi() {
    if (window.YT && YT.Player) {
        initPlayer();
        return;
    }
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
})();

const clips = [
    { id: "0HEE78L_CnA", start: 38,  end: 78 },
    { id: "8kkYTbO8mVw", start: 50,  end: 80 },
    { id: "dywPJV3o0M0", start: 60,   end: 90 }
];

let player;
let index = Math.floor(Math.random() * clips.length);
const hero = document.getElementById('hero');

function initPlayer() {
    const c = clips[index];
    player = new YT.Player('heroPlayer', {
        videoId: c.id,
        playerVars: {
            autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0,
            modestbranding: 1, rel: 0, iv_load_policy: 3, playsinline: 1,
            start: c.start, end: c.end
        },
        events: {
            onReady: e => e.target.playVideo(),
            onStateChange: onState
        }
    });
}

function onState(e) {
    if (e.data === YT.PlayerState.PLAYING) hero.classList.add('ready');   // плавно показываем
    if (e.data === YT.PlayerState.ENDED) next();
}

function next() {
    hero.classList.remove('ready');
    index = (index + 1) % clips.length;
    const c = clips[index];
    player.loadVideoById({ videoId: c.id, startSeconds: c.start, endSeconds: c.end });
}