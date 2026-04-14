document.addEventListener("DOMContentLoaded", () => {

    /* ================= SUPABASE ================= */
    const SUPABASE_URL = "https://hkgpbboxchmkliitytni.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ3BiYm94Y2hta2xpaXR5dG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTkzOTMsImV4cCI6MjA5MTU5NTM5M30.NAeWtu3iaass__hptSGmnm-AjSI-xEhdb1n3_TKg-sc";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    /* ================= STATE ================= */
    let currentUser = null;
    let isAdmin = false;
    let recipes = [];
    let posts = [];
    let deferredPrompt = null;

    const navButtons = document.querySelectorAll(".nav-btn");
    const pageContent = document.getElementById("pageContent");

    init();

    /* ================= INIT ================= */
    async function init() {
        bindEvents();
        setupPWA();
        await checkUser();
        await loadRecipes();
        await loadPosts();
        goToPage("inicio");
    }

    /* ================= EVENTS ================= */
    function bindEvents() {

        navButtons.forEach(btn => {
            btn.addEventListener("click", () => goToPage(btn.dataset.page));
        });

        document.getElementById("userBtn").onclick = () => {
            if (!currentUser) return renderAuth();
            document.getElementById("userMenu").classList.toggle("hidden");
        };

        document.getElementById("logoutOption").onclick = async () => {
            await supabase.auth.signOut();
            location.reload();
        };

        document.addEventListener("click", (e) => {

            // RECETAS
            if (e.target.classList.contains("view-btn")) {
                renderDetail(e.target.dataset.id);
            }

            if (e.target.id === "backBtn") {
                goToPage("recetario");
            }

            if (e.target.id === "exploreBtn") {
                goToPage("recetario");
            }

            // PWA
            if (e.target.id === "installBtn") {
                installApp();
            }

            // BLOG
            if (e.target.id === "publishPost") {
                createPost();
            }

            // ELIMINAR POST
            const deletePostBtn = e.target.closest(".delete-post");
            if (deletePostBtn) {
                deletePost(deletePostBtn.dataset.id);
            }

            // ELIMINAR RECETA
            const deleteRecipeBtn = e.target.closest(".delete-recipe");
            if (deleteRecipeBtn) {
                deleteRecipe(deleteRecipeBtn.dataset.id);
            }

        });
    }

    /* ================= PWA ================= */
    function setupPWA() {
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });
    }

    async function installApp() {
        if (!deferredPrompt) return alert("No disponible aún");
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    }

    /* ================= AUTH ================= */
    async function checkUser() {
        const { data } = await supabase.auth.getUser();

        if (data.user) {
            currentUser = data.user;
            isAdmin = data.user.user_metadata?.role === "admin";

            document.getElementById("usernameDisplay").textContent =
                data.user.user_metadata?.username || "Usuario";

            document.getElementById("usernameDisplay").classList.remove("hidden");
        }
    }

    function renderAuth(mode = "login") {

        const isLogin = mode === "login";

        pageContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-box">
                <h2>${isLogin ? "Bienvenida 💜" : "Crear cuenta ✨"}</h2>

                ${!isLogin ? `<input id="username" placeholder="Nombre de usuario">` : ""}

                <input id="email" placeholder="Correo">
                <input id="password" type="password" placeholder="Contraseña">

                <button id="authBtn">
                    ${isLogin ? "Iniciar sesión" : "Registrarse"}
                </button>

                <p class="switch-auth">
                    ${
                        isLogin
                        ? `¿No tienes cuenta? <span id="switchAuth">Regístrate</span>`
                        : `¿Ya tienes cuenta? <span id="switchAuth">Inicia sesión</span>`
                    }
                </p>
            </div>
        </div>
        `;

        document.getElementById("switchAuth").onclick = () => {
            renderAuth(isLogin ? "register" : "login");
        };

        document.getElementById("authBtn").onclick = async () => {

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            if (!email || !password) return alert("Completa los campos");

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) return alert(error.message);
            } else {
                const username = document.getElementById("username").value;
                if (!username) return alert("Agrega un nombre");

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username, role: "user" }
                    }
                });

                if (error) return alert(error.message);

                alert("Cuenta creada 💜");
                return renderAuth("login");
            }

            location.reload();
        };
    }

    /* ================= DATA ================= */

    async function loadRecipes() {
        const { data } = await supabase
            .from("recipes")
            .select("*")
            .order("id", { ascending: false });

        recipes = data || [];
    }

    async function loadPosts() {
        const { data } = await supabase
            .from("posts")
            .select("*")
            .order("id", { ascending: false });

        posts = data || [];
    }

    /* ================= BLOG ================= */

    async function createPost() {

        if (!currentUser) return alert("Inicia sesión 💜");

        const text = document.getElementById("postText").value;
        const file = document.getElementById("postImage").files[0];

        if (!text) return alert("Escribe algo");

        let imageUrl = null;

        // SUBIR IMAGEN
        if (file) {
            const fileName = `${currentUser.id}-${Date.now()}`;

            const { error } = await supabase.storage
                .from("post-images")
                .upload(fileName, file);

            if (error) {
                console.error(error);
                return alert("Error subiendo imagen");
            }

            const { data } = supabase.storage
                .from("post-images")
                .getPublicUrl(fileName);

            imageUrl = data.publicUrl;
        }

        await supabase.from("posts").insert([{
            user_id: currentUser.id,
            username: currentUser.user_metadata?.username || "Usuario",
            content: text,
            image: imageUrl
        }]);

        await loadPosts();
        renderPage("blog");
    }

    async function deletePost(id) {
        await supabase.from("posts").delete().eq("id", id);
        await loadPosts();
        renderPage("blog");
    }

    async function deleteRecipe(id) {
        await supabase.from("recipes").delete().eq("id", id);
        await loadRecipes();
        renderPage("recetario");
    }

    /* ================= NAV ================= */

    function goToPage(page) {
        navButtons.forEach(b => b.classList.remove("active"));
        document.querySelector(`[data-page="${page}"]`)?.classList.add("active");
        renderPage(page);
    }

    /* ================= RENDER ================= */

    function renderPage(page) {

        let html = "";

        if (page === "inicio") {
            html = `
                <div class="home-hero">
                    <h1>🍰 JAMM</h1>
                    <p>Endulza tu día con recetas 💜</p>
                    <button id="exploreBtn">Explorar</button>
                    <button id="installBtn">📲 Instalar App</button>
                </div>

                <h3>Últimas recetas</h3>
                <div id="homeGrid" class="grid-4"></div>
            `;
        }

        if (page === "recetario") {
            html = `
                <h2>Recetario</h2>
                <div id="recetario" class="grid-4"></div>
            `;
        }

        if (page === "blog") {
            html = `
                <div class="blog-layout">

                    <!-- IZQUIERDA -->
                    <div class="blog-left">
                        <h2>Crear publicación 🍰</h2>

                        ${
                            currentUser
                            ? `
                            <div class="card blog-form">
                                <textarea id="postText" placeholder="¿Qué quieres compartir hoy? 💜"></textarea>

                                <input type="file" id="postImage" accept="image/*">

                                <button id="publishPost">Publicar</button>
                            </div>
                            `
                            : `<p>Inicia sesión para publicar 💜</p>`
                        }
                    </div>

                    <!-- DERECHA -->
                    <div class="blog-right">
                        <h2>Publicaciones</h2>
                        <div id="postsContainer"></div>
                    </div>

                </div>
            `;
        }

        pageContent.innerHTML = html;

        if (page === "inicio") initHome();
        if (page === "recetario") initRecetario();
        if (page === "blog") initBlog();
    }

    /* ================= RECETAS ================= */

    function recipeCard(r) {
        return `
        <div class="card recipe-card">
            <img src="${r.image}" class="recipe-img">
            <h4>${r.name}</h4>

            <button class="view-btn" data-id="${r.id}">Ver más 👀</button>

            ${isAdmin ? `<button class="delete-recipe" data-id="${r.id}">🗑</button>` : ""}
        </div>
        `;
    }

    function initHome() {
        const c = document.getElementById("homeGrid");
        c.innerHTML = "";
        recipes.slice(0, 4).forEach(r => c.innerHTML += recipeCard(r));
    }

    function initRecetario() {
        const c = document.getElementById("recetario");
        c.innerHTML = "";
        recipes.forEach(r => c.innerHTML += recipeCard(r));
    }

    /* ================= BLOG RENDER ================= */

    function initBlog() {
        const c = document.getElementById("postsContainer");
        c.innerHTML = "";

        posts.forEach(p => {
            c.innerHTML += `
            <div class="card blog-post">
                <h4>${p.username}</h4>
                <p>${p.content}</p>

                ${p.image ? `<img src="${p.image}" class="post-img">` : ""}

                ${isAdmin ? `<button class="delete-post" data-id="${p.id}">Eliminar</button>` : ""}
            </div>
            `;
        });
    }

    /* ================= DETAIL ================= */

    function renderDetail(id) {
        const r = recipes.find(x => x.id == id);

        pageContent.innerHTML = `
            <button id="backBtn">⬅ Volver</button>
            <div class="card">
                <img src="${r.image}" class="detail-img">
                <h2>${r.name}</h2>
                <p>${r.ingredients}</p>
                <p>${r.preparation}</p>
            </div>
        `;
    }

});