dataReady.then(() => {
    const LABEL = { good: "Добро", evil: "Зло", guest: "Другие" };
    const ORDER = { good: 0, evil: 1, guest: 2 };

    const grid = document.querySelector(".fighters, .kameos");
    if (!grid) return;

    const isFighters = grid.classList.contains("fighters");
    const DATA = isFighters ? fighters : cameos;
    const FAV_KEY = isFighters ? "favFighters" : "favCameos";

    const original = [...grid.querySelectorAll(".fighter, .kameo")];
    const search = document.getElementById("fSearch");
    const chips = document.querySelectorAll(".chip[data-side]");
    const favBtn = document.getElementById("favOnly");
    const sortBtn = document.getElementById("sortSide");

    const nameOf = card => DATA[card.id].name.trim().toLowerCase();

    const empty = document.createElement("p");
    empty.className = "fighters__empty";
    empty.textContent = "Никого не найдено";
    empty.hidden = true;
    grid.after(empty);

    let favs = [];
    try { favs = JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) {}
    const saveFavs = () => {
        try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {}
    };

    original.forEach(card => {
        if (isFighters) {
            const s = DATA[card.id].side || "guest";
            card.dataset.side = s;
            const badge = document.createElement("em");
            badge.className = `badge badge--${s}`;
            badge.textContent = LABEL[s];
            card.append(badge);
        }

        const heart = document.createElement("button");
        heart.className = "heart";
        heart.type = "button";
        heart.setAttribute("aria-label", "В избранное");
        heart.textContent = "♥";
        heart.classList.toggle("on", favs.includes(card.id));
        heart.addEventListener("click", e => {
            e.stopPropagation();
            favs = favs.includes(card.id)
                ? favs.filter(id => id !== card.id)
                : [...favs, card.id];
            heart.classList.toggle("on", favs.includes(card.id));
            saveFavs();
            apply();
        });
        card.append(heart);
    });

    let side = "all";
    let onlyFav = false;
    let sortBySide = false;

    function apply() {
        const q = search.value.trim().toLowerCase();
        const exact = q !== "" && original.some(c => nameOf(c) === q);

        const list = sortBySide && isFighters
            ? [...original].sort((a, b) => ORDER[a.dataset.side] - ORDER[b.dataset.side])
            : original;
        list.forEach(c => grid.appendChild(c));

        let shown = 0;
        original.forEach(card => {
            const name = nameOf(card);
            const ok =
                (exact ? name === q : name.includes(q)) &&
                (side === "all" || card.dataset.side === side) &&
                (!onlyFav || favs.includes(card.id));
            card.classList.toggle("is-hidden", !ok);
            if (ok) shown++;
        });
        empty.hidden = shown > 0;
    }

    search.addEventListener("input", apply);

    chips.forEach(chip => chip.addEventListener("click", () => {
        side = chip.dataset.side;
        chips.forEach(c => c.classList.toggle("active", c === chip));
        apply();
    }));

    favBtn?.addEventListener("click", () => {
        onlyFav = !onlyFav;
        favBtn.classList.toggle("active", onlyFav);
        apply();
    });

    sortBtn?.addEventListener("click", () => {
        sortBySide = !sortBySide;
        sortBtn.classList.toggle("active", sortBySide);
        apply();
    });

    const fromLink = new URLSearchParams(location.search).get("search");
    if (fromLink) search.value = fromLink;

    apply();
}).catch(err => console.error("Фильтры:", err));