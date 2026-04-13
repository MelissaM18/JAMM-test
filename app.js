document.addEventListener("DOMContentLoaded", () => {

    /* ================= SUPABASE ================= */

    const SUPABASE_URL = "https://hkgpbboxchmkliitytni.supabase.co";
    const SUPABASE_KEY = "TU_ANON_KEY_AQUI"; // ⚠️ cambia si vuelve a fallar

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    /* ================= VARIABLES ================= */

    let currentUser = null;
    let isAdmin = false;
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

    document.getElementById("userBtn").onclick = () => {
        document.getElementById("userMenu").classList.toggle("hidden");
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

            const role = currentUser.user_metadata?.role;
            isAdmin = role === "admin";

            showUserUI();
        }
    }

    function showUserUI() {
        const username = currentUser?.user_metadata?.username || "Usuario";

        document.getElementById("usernameDisplay").textContent = username;
        document.getElementById("usernameDisplay").classList.remove("hidden");

        document.getElementById("logoutOption").classList.remove("hidden");
        document.getElementById("loginOption").classList.add("hidden");
        document.getElementById("registerOption").classList.add("hidden");
    }

    function renderAuth(type) {
        pageContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>${type === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
                ${type === "register" ? `<input id="username" placeholder="Nombre">` : ""}

                <input id="email" placeholder="Correo">
                <input id="password" type="password" placeholder="Contraseña">

                <button id="authBtn">
                    ${type === "login" ? "Entrar" : "Registrarse"}
                </button>

                <p class="auth-switch">
                    ${
                        type === "login"
                        ? `¿No tienes cuenta? <span id="switchAuth">Regístrate</span>`
                        : `¿Ya tienes cuenta? <span id="switchAuth">Inicia sesión</span>`
                    }
                </p>
            </div>
        </div>
        `;

        /* CAMBIO ENTRE LOGIN Y REGISTER */
        document.getElementById("switchAuth").onclick = () => {
            renderAuth(type === "login" ? "register" : "login");
        };

        /* ACCIÓN PRINCIPAL */
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

    /* ================= RECETAS ================= */

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
        }

        pageContent.innerHTML = content;

        if (page === "inicio") initHome();
        if (page === "recetario") initRecetario();
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
            ${isAdmin ? `<button id="add" class="cute-btn">➕ Nueva receta</button>` : ""}
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

                ${isAdmin ? `
                <button class="del" data-id="${r.id}">🗑</button>
                ` : ""}
            </div>`;
        });

        if (isAdmin) {
            document.getElementById("add").onclick = renderForm;
        }

        document.querySelectorAll(".view").forEach(btn => {
            btn.onclick = () => renderDetail(btn.dataset.id);
        });

        document.querySelectorAll(".del").forEach(btn => {
            btn.onclick = async () => {
                await supabase.from("recipes").delete().eq("id", btn.dataset.id);
                loadRecipes();
            };
        });
    }

    /* ================= FORM ================= */

    function renderForm() {

        const container = document.getElementById("recetario");

        container.innerHTML = `
        <button id="back" class="back-btn">⬅ Volver</button>

        <div class="card form-card">

            <h3>🍰 Nueva receta</h3>

            <input id="name" placeholder="Nombre">
            <input id="cat" placeholder="Categoría">

            <textarea id="ing" placeholder="Ingredientes"></textarea>
            <textarea id="prep" placeholder="Preparación"></textarea>

            <input type="file" id="img">

            <button id="save">Guardar</button>

        </div>
        `;

        document.getElementById("back").onclick = initRecetario;

        document.getElementById("save").onclick = async () => {

            const file = document.getElementById("img").files[0];
            if (!file) return alert("Selecciona imagen");

            const reader = new FileReader();

            reader.onload = async (e) => {

                await supabase.from("recipes").insert([{
                    name: document.getElementById("name").value,
                    category: document.getElementById("cat").value,
                    ingredients: document.getElementById("ing").value,
                    preparation: document.getElementById("prep").value,
                    image: e.target.result
                }]);

                loadRecipes();
            };

            reader.readAsDataURL(file);
        };
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

            <h4>Ingredientes</h4>
            <ul>
                ${recipe.ingredients.split("\n").map(i => `<li>${i}</li>`).join("")}
            </ul>

            <h4>Preparación</h4>
            <p>${recipe.preparation}</p>

        </div>
        `;

        document.getElementById("back").onclick = initRecetario;
    }

    /* ================= INIT ================= */

    checkUser();
    loadRecipes();

});