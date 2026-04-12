document.addEventListener("DOMContentLoaded", () => {

    const navButtons = document.querySelectorAll(".nav-btn");
    const pageContent = document.getElementById("pageContent");

    let recipes = JSON.parse(localStorage.getItem("jamm_recipes")) || [];

    /* ================= NAV ================= */

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => goToPage(btn.dataset.page));
    });

    function goToPage(page) {
        navButtons.forEach(b => b.classList.remove("active"));
        document.querySelector(`[data-page="${page}"]`)?.classList.add("active");
        renderPage(page);
    }

    /* ================= RENDER ================= */

    function renderPage(page) {

        let content = "";

        switch (page) {

            case "inicio":
                content = `
                <div class="home-hero">
                    <h1>🍰 Bienvenida a JAMM</h1>
                    <p>Endulza tu día con recetas 💜</p>
                    <button id="exploreBtn">Explorar</button>
                </div>

                <h3>✨ Últimas recetas</h3>
                <div id="homeLatest" class="grid-4"></div>
                `;
                break;

            case "recetario":
                content = `<h2>Recetario</h2><div id="recetario"></div>`;
                break;

            case "favoritos":
                content = `<h2>Favoritos 💖</h2><div id="favoritos"></div>`;
                break;

            case "app":
                content = `
                <div style="text-align:center;">
                    <h2>📲 Instalar JAMM</h2>
                    <button id="installBtn">Instalar App</button>
                </div>
                `;
                break;

            case "tienda":
                content = `<h2>Tienda 🛒</h2><p>Próximamente</p>`;
                break;
        }

        pageContent.innerHTML = content;

        if (page === "inicio") initHome();
        if (page === "recetario") initRecetario();
        if (page === "favoritos") initFavoritos();
        if (page === "app") initInstall();
    }

    /* ================= HOME ================= */

    function initHome() {

        document.getElementById("exploreBtn")
            ?.addEventListener("click", () => goToPage("recetario"));

        const container = document.getElementById("homeLatest");

        recipes.slice(-4).reverse().forEach(r => {
            container.innerHTML += `
            <div class="card">
                <img src="${r.image}" class="recipe-img">
                <h4>${r.name}</h4>
            </div>`;
        });
    }

    /* ================= RECETARIO ================= */

    function initRecetario() {

        const container = document.getElementById("recetario");

        container.innerHTML = `
            <button id="add" class="cute-btn">➕ Nueva receta</button>
            <div class="grid-4"></div>
        `;

        const grid = container.querySelector(".grid-4");

        recipes.forEach(r => {
            grid.innerHTML += `
            <div class="card recipe-card">

                <img src="${r.image}" class="recipe-img">

                <h4>${r.name}</h4>
                <p>${r.category}</p>

                <button class="view" data-id="${r.id}">
                    Ver más 👀
                </button>

                <div class="card-actions">
                    <button class="fav" data-id="${r.id}">
                        ${r.favorite ? "💖" : "🤍"}
                    </button>
                    <button class="del" data-id="${r.id}">🗑</button>
                </div>

            </div>`;
        });

        /* EVENTOS */

        document.getElementById("add").onclick = renderForm;

        document.querySelectorAll(".view").forEach(btn => {
            btn.onclick = () => renderDetail(btn.dataset.id);
        });

        document.querySelectorAll(".del").forEach(btn => {
            btn.onclick = () => {
                if (!confirm("¿Eliminar receta? 💜")) return;
                recipes = recipes.filter(r => r.id != btn.dataset.id);
                save();
                initRecetario();
            };
        });

        document.querySelectorAll(".fav").forEach(btn => {
            btn.onclick = () => {
                const r = recipes.find(x => x.id == btn.dataset.id);
                r.favorite = !r.favorite;
                save();
                initRecetario();
            };
        });
    }

    /* ================= DETALLE ================= */

    function renderDetail(id) {

        const recipe = recipes.find(r => r.id == id);
        const container = document.getElementById("recetario");

        container.innerHTML = `
        <button id="back" class="cute-btn">⬅ Volver</button>

        <div class="card detail-card">

            <div class="detail-grid">

                <!-- IZQUIERDA -->
                <div class="detail-left">
                        <img src="${recipe.image}" class="detail-img">
                    <h4>Ingredientes</h4>
                    <div class="ingredients-box">
                        <ul>
                            ${recipe.ingredients
                                .split("\n")
                                .map(i => `<li>${i}</li>`)
                                .join("")}
                        </ul>
                    </div>
                </div>

                <!-- DERECHA -->
                <div class="detail-right">

                    <h2>${recipe.name}</h2>
                    <p><strong>Categoría:</strong> ${recipe.category}</p>

                    <h3>Preparación</h3>

                    <p class="prep-text">
                        ${recipe.preparation.replace(/\n/g, "<br><br>")}
                    </p>

                </div>

            </div>

        </div>
        `;

        document.getElementById("back").onclick = initRecetario;
    }

    /* ================= FORMULARIO ================= */

    function renderForm() {

        const container = document.getElementById("recetario");

        container.innerHTML = `
        <button id="back" class="cute-btn">⬅ Volver</button>

        <div class="card form-card">

            <h3>🍰 Nueva receta</h3>

            <input id="name" placeholder="Nombre del postre">
            <input id="cat" placeholder="Categoría (Ej: Pastel, Galletas)">

            <textarea id="ing" placeholder="Ingredientes (uno por línea)"></textarea>

            <textarea id="prep" placeholder="Preparación paso a paso"></textarea>

            <input type="file" id="img">

            <button id="save" class="cute-btn">Guardar receta ✨</button>

        </div>
        `;

        document.getElementById("back").onclick = initRecetario;

        document.getElementById("save").onclick = () => {

            const nameInput = document.getElementById("name").value;
            const catInput = document.getElementById("cat").value;
            const ingInput = document.getElementById("ing").value;
            const prepInput = document.getElementById("prep").value;

            const file = document.getElementById("img").files[0];
            if (!file) return alert("Selecciona imagen 💜");

            const reader = new FileReader();

            reader.onload = e => {

                recipes.push({
                    id: Date.now(),
                    name: nameInput,
                    category: catInput,
                    ingredients: ingInput,
                    preparation: prepInput,
                    image: e.target.result,
                    favorite: false
                });

                save();
                initRecetario();
            };

            reader.readAsDataURL(file);
        };
    }

    /* ================= FAVORITOS ================= */

    function initFavoritos() {

        const container = document.getElementById("favoritos");

        const favs = recipes.filter(r => r.favorite);

        if (favs.length === 0) {
            container.innerHTML = "<p>No tienes favoritos 💜</p>";
            return;
        }

        container.innerHTML = `<div class="grid-4"></div>`;
        const grid = container.querySelector(".grid-4");

        favs.forEach(r => {
            grid.innerHTML += `
            <div class="card">
                <img src="${r.image}" class="recipe-img">
                <h4>${r.name}</h4>
            </div>`;
        });
    }

    /* ================= PWA ================= */

    let deferredPrompt;

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    function initInstall() {

        const btn = document.getElementById("installBtn");

        btn.onclick = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
            } else {
                alert("Usa menú del navegador 📲");
            }
        };
    }

    /* ================= STORAGE ================= */

    function save() {
        localStorage.setItem("jamm_recipes", JSON.stringify(recipes));
    }

    renderPage("inicio");
});