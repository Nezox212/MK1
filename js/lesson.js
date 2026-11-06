const tabs = document.querySelectorAll('.tab_content_item');
const tabBlocks = document.querySelectorAll('.tab_content_block');

const INTERVAL = 15000;
let currentIndex = 0;
let autoSwitch = null;

const showBlock = (index = 0) => {
    if (!tabBlocks.length || !tabs.length) return;
    currentIndex = index;
    tabBlocks.forEach((block, i) => block.classList.toggle('active', i === index));
    tabs.forEach((tab, i) => tab.classList.toggle('active', i === index));
};

const startAutoSwitch = () => {
    clearInterval(autoSwitch);
    autoSwitch = setInterval(() => {
        showBlock((currentIndex + 1) % tabs.length);
    }, INTERVAL);
};

tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
        showBlock(i);
        startAutoSwitch();
    });
});

showBlock(0);
startAutoSwitch();