
const showBlock = (index = 0) => {
    tabBlocks.forEach((block, i) => block.classList.toggle('active', i == index));
    tabs.forEach((tab, i) => tab.classList.toggle('active', i == index));

}
showBlock();
tabsParent.onclick = (event) => {

    const selectedElement = event.target.closest('.tab_content_item');
    if(!selectedElement) return;

    const index = [...tabs].indexOf(selectedElement);
    showBlock(index);
}



const startAutoSwitch = () => {
    return setInterval(() => {
        const activeIndex = [...tabs].findIndex(tab => tab.classList.contains('active'));
        showBlock((activeIndex + 1) % tabs.length);
    }, 15000);
};

let autoSwitch = startAutoSwitch();