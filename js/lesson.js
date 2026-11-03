const tabsParent = document.querySelector('.tab_parent_class'); // Update with your parent container class/id
const tabs = document.querySelectorAll('.tab_content_item');   // Update with your tab buttons class
const tabBlocks = document.querySelectorAll('.tab_content_block'); // Update with your content blocks class

const showBlock = (index = 0) => {
    if (!tabBlocks.length || !tabs.length) return;
    tabBlocks.forEach((block, i) => block.classList.toggle('active', i == index));
    tabs.forEach((tab, i) => tab.classList.toggle('active', i == index));
};

showBlock();

if (tabsParent) {
    tabsParent.onclick = (event) => {
        const selectedElement = event.target.closest('.tab_content_item');
        if (!selectedElement) return;

        const index = [...tabs].indexOf(selectedElement);
        if (index !== -1) showBlock(index);
    };
}

const startAutoSwitch = () => {
    return setInterval(() => {
        const activeIndex = [...tabs].findIndex(tab => tab.classList.contains('active'));
        showBlock((activeIndex + 1) % tabs.length);
    }, 15000);
};

let autoSwitch = startAutoSwitch();