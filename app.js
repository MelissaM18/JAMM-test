document.addEventListener("DOMContentLoaded", () => {

    /* ================= SUPABASE ================= */

    const SUPABASE_URL = "https://hkgpbboxchmkliitytni.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ3BiYm94Y2hta2xpaXR5dG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTkzOTMsImV4cCI6MjA5MTU5NTM5M30.NAeWtu3iaass__hptSGmnm-AjSI-xEhdb1n3_TKg-sc";

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    /* ================= VARIABLES ================= */

    let currentUser = null;
    let recipes = [];

    const navButtons = document.querySelectorAll(".nav-btn");
    const pageContent = document.getElementById("pageContent");

    /* ================= NAV ================= */

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => goToPage(btn.dataset.page));
    });

    function goToPage(page) {
        navButtons.forEach(b => b.classList.remove("active"));
        document.querySelector(`[data-page="${page}"]`)?.classList.add("active");
        renderPage(page);
    }

    /* ================= USER MENU ================= */

    const userBtn = document.getElementById("userBtn");
    const userMenu = document.getElementById("userMenu");

    userBtn.onclick = () => {
        userMenu.classList.toggle("hidden");
    };

    document.getElementById("loginOption").onclick = () => renderAuth("login");
    document.getElementById("registerOption").onclick = () => renderAuth("register");

    document.getElementById("logoutOption").onclick = async () => {
        await supabase.auth.signOut();
        location.reload();
    };

    /* ================= AUTH ================= */

    async function checkUser() {
        const { data } = await supabase.auth.getUser();

        if (data.user) {
            currentUser = data.user;
            showUserUI();
        }
    }

    function showUserUI() {
        if (!currentUser) return;

        const username = currentUser.user_metadata?.username || "Usuario";

        document.getElementById("usernameDisplay").textContent = username;
        document.getElementById("usernameDisplay").classList.remove("hidden");

        document.getElementById("logoutOption").classList.remove("hidden");
        document.getElementById("loginOption").classList.add("hidden");
        document.getElementById("registerOption").classList.add("hidden");
    }

    function isAdmin() {
        return currentUser?.user_metadata?.role === "admin";
    }

    function renderAuth(type) {

        pageContent.innerHTML = `
        <button id="back" class="back-btn">⬅ Volver</button>

        <div class="card form-card">

            <h2>${type === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>

            ${type === "register" ? `<input id="username" placeholder="Nombre">` : ""}

            <input id="email" placeholder="Correo">
            <input id="password" type="password" placeholder="Contraseña">

            <button id="authBtn">
                ${type === "login" ? "Entrar" : "Registrarse"}
            </button>

        </div>
        `;

        document.getElementById("back").onclick = () => renderPage("inicio");

        document.getElementById("authBtn").onclick = async () => {

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            if (type === "login") {

                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) return alert(error.message);

            } else {

                const username = document.getElementById("username").value;

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username,
                            role: "user"
                        }
                    }
                });

                if (error) return alert(error.message);

                alert("Cuenta creada 💜");
            }

            location.reload();
        };
    }

    /* ================= LOAD RECIPES ================= */

    async function loadRecipes() {
        const { data, error } = await supabase
            .from("recipes")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            console.error(error);
            return;
        }

        recipes = data;
        renderPage("inicio");
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
                </div>`;
                break;

            case "tienda":
                content = `<h2>Tienda 🛒</h2><p>Próximamente</p>`;
                break;
        }

        pageContent.innerHTML = content;

        if (page === "inicio") initHome();
        if (page === "recetario") initRecetario();
        if (page === "favoritos") initFavoritos();
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
            ${isAdmin() ? `<button id="add" class="cute-btn">➕ Nueva receta</button>` : ""}
            <div class="grid-4"></div>
        `;

        const grid = container.querySelector(".grid-4");

        recipes.forEach(r => {
            grid.innerHTML += `
            <div class="card recipe-card">

                <img src="${r.image}" class="recipe-img">

                <h4>${r.name}</h4>
                <p>${r.category}</p>

                <button class="view" data-id="${r.id}">Ver más 👀</button>

                <div class="card-actions">
                    <button class="fav" data-id="${r.id}">
                        ${r.favorite ? "💖" : "🤍"}
                    </button>
                    ${isAdmin() ? `<button class="del" data-id="${r.id}">🗑</button>` : ""}
                </div>

            </div>`;
        });

        if (isAdmin()) {
            document.getElementById("add").onclick = renderForm;
        }

        document.querySelectorAll(".view").forEach(btn => {
            btn.onclick = () => renderDetail(btn.dataset.id);
        });

        document.querySelectorAll(".del").forEach(btn => {
            btn.onclick = async () => {
                if (!isAdmin()) return alert("No autorizado 🚫");

                await supabase.from("recipes").delete().eq("id", btn.dataset.id);
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

    /* ================= INIT ================= */

    checkUser();
    loadRecipes();

});