(() => {
    // Стороны бойцов. Если с каким-то не согласны, меняйте здесь.
    const SIDES = {
        "sub-zero": "good", "scorpion": "good", "smoke": "good", "kung-lao": "good",
        "raiden": "good", "kenshi": "good", "ashrah": "good", "johnny-cage": "good",
        "li-mei": "good", "liu-kang": "good", "takeda": "guest", "cyrax": "guest",
        "kitana": "evil", "sindel": "evil",

        "reptile": "good", "geras": "good", "baraka": "good", "noob-saibot": "guest",
        "ermac": "guest", "sektor": "guest", "nitara": "evil", "reiko": "evil",
        "havik": "evil", "tanya": "evil", "mileena": "evil", "rain": "evil",
        "general-shao": "evil", "quan-chi": "evil", "shang-tsung": "evil",

        "peacemaker": "guest", "homelander": "guest", "ghostface": "guest",
        "conan": "guest", "t-1000": "guest", "omni-man": "guest"
    };
    const LABEL = { good: "Добро", evil: "Зло", guest: "Гость" };
    const ORDER = { good: 0, evil: 1, guest: 2 };

    const grid = document.querySelector(".fighters");
    const original = [...grid.querySelectorAll(".fighter")];
    const search = document.getElementById("fSearch");
    const chips = document.querySelectorAll(".chip[data-side]");
    const favBtn = document.getElementById("favOnly");
    const sortBtn = document.getElementById("sortSide");

    const empty = document.createElement("p");
    empty.className = "fighters__empty";
    empty.textContent = "Никого не найдено";
    empty.hidden = true;
    grid.after(empty);

    // ---------- избранное ----------
    let favs = [];
    try { favs = JSON.parse(localStorage.getItem("favFighters")) || []; } catch (e) {}
    const saveFavs = () => {
        try { localStorage.setItem("favFighters", JSON.stringify(favs)); } catch (e) {}
    };

    // ---------- сердечко и бейдж на каждой карточке ----------
    original.forEach(card => {
        const side = SIDES[card.id] || "guest";
        card.dataset.side = side;

        const badge = document.createElement("em");
        badge.className = `badge badge--${side}`;
        badge.textContent = LABEL[side];
        card.append(badge);

        const heart = document.createElement("button");
        heart.className = "heart";
        heart.type = "button";
        heart.setAttribute("aria-label", "В избранное");
        heart.textContent = "♥";
        heart.classList.toggle("on", favs.includes(card.id));
        heart.addEventListener("click", e => {
            e.stopPropagation();                 // чтобы не открывалась модалка
            favs = favs.includes(card.id)
                ? favs.filter(id => id !== card.id)
                : [...favs, card.id];
            heart.classList.toggle("on", favs.includes(card.id));
            saveFavs();
            apply();
        });
        card.append(heart);
    });

    // ---------- фильтры ----------
    let side = "all";
    let onlyFav = false;
    let sortBySide = false;

    function apply() {
        const q = search.value.trim().toLowerCase();

        // порядок: по умолчанию или по сторонам (добро, зло, гости)
        const list = sortBySide
            ? [...original].sort((a, b) => ORDER[a.dataset.side] - ORDER[b.dataset.side])
            : original;
        list.forEach(c => grid.appendChild(c));

        let shown = 0;
        original.forEach(card => {
            const name = card.querySelector("span").textContent.toLowerCase();
            const ok =
                name.includes(q) &&
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

    favBtn.addEventListener("click", () => {
        onlyFav = !onlyFav;
        favBtn.classList.toggle("active", onlyFav);
        apply();
    });

    sortBtn.addEventListener("click", () => {
        sortBySide = !sortBySide;
        sortBtn.classList.toggle("active", sortBySide);
        apply();
    });

    apply();
})();