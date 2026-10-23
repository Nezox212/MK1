const move = document.querySelector('.child_block');
let posX = 0;
let posY = 0;
let direction = 'right';

const moveFunc = () => {
    setInterval(() => {
        if (direction === 'right') {
            posX++
            if(posX >= 450) direction = 'down';
        }else if(direction === 'down') {
            posY++
            if(posY >= 450) direction = 'left';
        }else if(direction === 'left') {
            posX--
            if(posX <= 0) direction = 'up';
        }else if(direction === 'up') {
            posY--
            if(posY <= 0) direction = 'right';
        }
        move.style.left = `${posX}px`;
        move.style.top = `${posY}px`;
    },5)
}
moveFunc();


const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
const reset = document.querySelector('#reset');
const seconds = document.querySelector('#seconds');
let startTimer = null;

let time = 0;
start.onclick = () => {
    if (startTimer) return;
    startTimer = setInterval(() => {
        time++
        seconds.textContent = time;
    },1000)
}

stop.onclick = () => {

    clearInterval(startTimer);
    startTimer = null;
}
reset.onclick = () => {
    time = 0;
    seconds.textContent = time;

    clearInterval(startTimer);
    startTimer = null;
}
//characters
const charactersList = document.querySelector(".characters-list");

const charactersFunc = async () => {
    try {
        const response = await fetch("../json/characters.json");        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log(data);

        charactersList.innerHTML = "";
        data.forEach(({ name, age, person_photo }) => {
            const card = document.createElement("div");
            card.className = "character-card";
            card.innerHTML = `
                <img src="${person_photo}" alt="${name}">
                <h2 class="character-name">${name}</h2>
                <p>Возраст: ${age}</p>
            `;

            const img = card.querySelector("img");
            img.onerror = () => {
                img.onerror = null;
                img.src = "https://placehold.co/200x250?text=No+photo";
            };

            charactersList.append(card);
        });
    } catch (error) {
        console.error("Ошибка загрузки персонажей:", error);
        charactersList.innerHTML = "<p>Не удалось загрузить персонажей</p>";
    }
};

charactersFunc();

const som = document.querySelector("#som");
const usd = document.querySelector("#usd");
const eur = document.querySelector("#eur");

const converter = (one,two,three) => {
    one.oninput = async() => {
        const responce = await fetch("../json/converter.json", {})
        const {usd,eur} = await responce.json();

        if(one.id == "som"){
            two.value = (one.value / usd).toFixed(2);
            three.value = (one.value / eur ).toFixed(2);
        }
        else if(one.id == "usd"){
            two.value = (one.value * usd).toFixed(2);
            three.value = (one.value * usd / eur).toFixed(2);
        }
        else if(one.id == "eur"){
            two.value = (one.value * eur).toFixed(2);
            three.value = (one.value * eur / usd).toFixed(2);
        }
    }
}
converter(som,usd,eur)
converter(usd,som,eur)
converter(eur,som,usd)





const card = document.querySelector(".card");
const next  = document.querySelector("#btn-next");
const prev = document.querySelector("#btn-prev");

let count = 0;

const TODO_API = (id) => `https://jsonplaceholder.typicode.com/todos/${id}`
const fetchTodoNext = async() => {
    if(count >= 200){
        count = 0;
    }
    count++;
    const response = await fetch(TODO_API(count));
    const {id, title, completed} = await response.json();
    const color = completed ? 'green' : 'red';
    card.style.borderColor = color;
    card.innerHTML = `
    <p class="text_card">ID - ${id}</p>
    <p class="text_card">${title}</p>
    <p class="text_card" style="color: ${color}">${completed ? 'Completed' : 'Must to do!'}</p>
  `
}

fetchTodoNext();

const fetchTodoPrev = async() => {
    if(count <= 1){
        count = 201;
    }
    count--;
    const response = await fetch(TODO_API(count));
    const {id, title, completed} = await response.json();
    const color = completed ? 'green' : 'red';

    card.style.borderColor = color;
    card.innerHTML = `
    <p class="text_card" >ID - ${id}</p>
    <p class="text_card" >${title}</p>
    <p class="text_card" style="color: ${color}">${completed ? 'Completed' : 'Must to do!'}</p>
  `
}
next.onclick = fetchTodoNext;
prev.onclick = fetchTodoPrev;