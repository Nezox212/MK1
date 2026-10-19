const tabBlocks = document.querySelectorAll('.tab_content_block');
const tabs = document.querySelectorAll('.tab_content_item');
const tabsParent = document.querySelector('.tab_content_items');

// const hideBlocks = () => {
//   tabBlocks.forEach((item) => {
//     item.classList.remove('active');
//   });
//   tabs.forEach((item) => {
//     item.classList.remove('active')
//   })
// }

// const showBlock = (index = 0) => {
//   tabBlocks[index].classList.add('active');
//   tabs[index].classList.add('active');
// }


// tabsParent.onclick = (event) => {
//   if(event.target.tagName.toLowerCase() == 'button'){
//     const index = [...tabs].indexOf(event.target);
//     hideBlocks();
//     showBlock(index);
//   }
// }

// const array = ['yellow', 'red', 'violet'];

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