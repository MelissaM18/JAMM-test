document.addEventListener("DOMContentLoaded", () => {

    /* ================= SUPABASE ================= */

    const SUPABASE_URL = "https://trxffngabmynqbrhybjd.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyeGZmbmdhYm15bnFicmh5YmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDgzMzcsImV4cCI6MjA5MTU4NDMzN30.-jwnO1LZUxHPYv4-4MdqFNu9ZemWqiNH9QjIvW-Qz1w";

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let currentUser = null;

    /* ================= VARIABLES ================= */

    const navButtons = document.querySelectorAll(".nav-btn");
    const pageContent = document.getElementById("pageContent");

    let recipes = [];

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

    /* ================= LOAD RECIPES ================= */

    async function loadRecipes() {
        const { data, error } = await supabase
            .from("recipes")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            console.error("Error cargando recetas:", error);
            return;
        }

        recipes = data;
        renderPage("inicio");
    }

    /* ================= HOME ================= */

    function initHome() {

        document.getElementById("exploreBtn")
            ?.addEventListener("click", () => goToPage("recetario"));

        const container = document.getElementById("homeLatest");

        recipes.slice(0, 4).forEach(r => {
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

        document.getElementById("add").onclick = renderForm;

        document.querySelectorAll(".view").forEach(btn => {
            btn.onclick = () => renderDetail(btn.dataset.id);
        });

        document.querySelectorAll(".del").forEach(btn => {
            btn.onclick = async () => {
                if (!confirm("¿Eliminar receta? 💜")) return;

                await supabase
                    .from("recipes")
                    .delete()
                    .eq("id", btn.dataset.id);

                loadRecipes();
            };
        });

        document.querySelectorAll(".fav").forEach(btn => {
            btn.onclick = async () => {

                const r = recipes.find(x => x.id == btn.dataset.id);

                await supabase
                    .from("recipes")
                    .update({ favorite: !r.favorite })
                    .eq("id", r.id);

                loadRecipes();
            };
        });
    }

    /* ================= DETALLE ================= */

    function renderDetail(id) {

        const recipe = recipes.find(r => r.id == id);
        const container = document.getElementById("recetario");

        container.innerHTML = `
        <button id="back" class="back-btn">⬅ Volver</button>

        <div class="card detail-card">

            <img src="${recipe.image}" class="detail-img">

            <h2>${recipe.name}</h2>
            <p class="category">${recipe.category}</p>

            <div class="detail-columns">

                <div class="ingredients">
                    <h4>🧾 Ingredientes</h4>
                    <ul>
                        ${recipe.ingredients.split("\n").map(i => `<li>${i}</li>`).join("")}
                    </ul>
                </div>

                <div class="preparation">
                    <h4>👩‍🍳 Preparación</h4>
                    <p>${recipe.preparation}</p>
                </div>

            </div>

        </div>
        `;

        document.getElementById("back").onclick = initRecetario;
    }

    /* ================= FORM ================= */

    function renderForm() {

        const container = document.getElementById("recetario");

        container.innerHTML = `
        <button id="back" class="back-btn">⬅ Volver</button>

        <div class="card form-card">

            <h3>🍰 Nueva receta</h3>

            <input id="name" placeholder="Nombre del postre">
            <input id="cat" placeholder="Categoría">

            <textarea id="ing" placeholder="Ingredientes (uno por línea)"></textarea>

            <textarea id="prep" placeholder="Preparación detallada"></textarea>

            <input type="file" id="img">

            <button id="save" class="cute-btn">Guardar receta ✨</button>

        </div>
        `;

        document.getElementById("back").onclick = initRecetario;

        document.getElementById("save").onclick = async () => {

            const file = document.getElementById("img").files[0];
            if (!file) return alert("Selecciona imagen 💜");

            const reader = new FileReader();

            reader.onload = async (e) => {

                await supabase.from("recipes").insert([{
                    name: document.getElementById("name").value,
                    category: document.getElementById("cat").value,
                    ingredients: document.getElementById("ing").value,
                    preparation: document.getElementById("prep").value,
                    image: e.target.result,
                    favorite: false
                }]);

                loadRecipes();
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

    /* ================= INIT ================= */

    loadRecipes();

    /* ================= AUTH ================= */

    async function login() {
        const email = prompt("Correo:");
        const password = prompt("Contraseña:");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert("Error al iniciar sesión");
            console.error(error);
            return;
        }

        currentUser = data.user;
        alert("Bienvenida 💜");
        updateUI();
    }

    async function logout() {
        await supabase.auth.signOut();
        currentUser = null;
        updateUI();
    }

    function updateUI() {
        document.getElementById("loginBtn").style.display = currentUser ? "none" : "inline-block";
        document.getElementById("logoutBtn").style.display = currentUser ? "inline-block" : "none";
    }

    document.getElementById("loginBtn").onclick = login;
    document.getElementById("logoutBtn").onclick = logout;

    /* Detectar sesión activa */
    supabase.auth.getUser().then(({ data }) => {
        currentUser = data.user;
        updateUI();
    });
});
