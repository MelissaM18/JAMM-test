document.addEventListener("DOMContentLoaded", async () => {

    console.log("🔥 JAMM APP INICIADA");

    /* ================= SUPABASE ================= */
    const SUPABASE_URL = "https://hkgpbboxchmkliitytni.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZ3BiYm94Y2hta2xpaXR5dG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTkzOTMsImV4cCI6MjA5MTU5NTM5M30.NAeWtu3iaass__hptSGmnm-AjSI-xEhdb1n3_TKg-sc";

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    /* ================= STATE ================= */
    let currentUser = null;
    let isAdmin = false;

    let recipes = [];
    let posts = [];
    let postLikes = [];
    let recipeLikes = [];

    let deferredPrompt = null;

    const navButtons = document.querySelectorAll(".nav-btn");
    const pageContent = document.getElementById("pageContent");

    let currentPage = "inicio";

    /* ================= INIT ================= */
    init();

    async function init() {
        bindEvents();
        setupPWA();

        await checkUser();
        await loadRecipes();
        await loadPosts();
        await loadLikes();

        goToPage("inicio");

        console.log("✅ APP LISTA");
    }

    /* ================= EVENTS ================= */
    function bindEvents() {

        console.log("📌 Eventos cargados");

        navButtons.forEach(btn =>
            btn.addEventListener("click", () => goToPage(btn.dataset.page))
        );

        document.addEventListener("click", (e) => {

            if (e.target.id === "saveRecipe") saveRecipe();

            const delRecipe = e.target.closest(".delete-recipe");
                if (delRecipe) deleteRecipe(delRecipe.dataset.id);

            const editRecipe = e.target.closest(".edit-recipe");
                if (editRecipe) editRecipeForm(editRecipe.dataset.id);

            if (e.target.id === "publishPost") createPost();

            const editPost = e.target.closest(".edit-post");
                if (editPost) renderEditPost(editPost.dataset.id);

            const delPost = e.target.closest(".delete-post");
                if (delPost) deletePost(delPost.dataset.id);

            if (e.target.id === "addRecipeBtn") renderAddRecipe();

            if (e.target.id === "updateRecipe")
                updateRecipe(e.target.dataset.id);
            
            if (e.target.id === "updatePost")
                updatePost(e.target.dataset.id);

            const menu = document.getElementById("userMenu");

            if (menu && !e.target.closest(".user-section")) {
                menu.classList.add("hidden");
            }

            const view = e.target.closest(".view-btn");
            if (view) renderDetail(view.dataset.id);

            const likePost = e.target.closest(".like-post");
            if (likePost) togglePostLike(likePost.dataset.id);

            const likeRecipe = e.target.closest(".like-recipe");
            if (likeRecipe) toggleRecipeLike(likeRecipe.dataset.id);

            const back = e.target.closest("#backBtn");
            if (back) goToPage("recetario");

            const explore = e.target.closest("#exploreBtn");
            if (explore) goToPage("recetario");

            const install = e.target.closest("#installBtn");
            if (install) installApp();

            const logoutBtn = document.getElementById("logoutBtn");

            if (logoutBtn) {
                logoutBtn.onclick = logout;
            }
        });

        const userBtn = document.getElementById("userBtn");

        if (userBtn) {
            userBtn.onclick = () => {
                if (!currentUser) return renderAuth();

                const menu = document.getElementById("userMenu");
                if (menu) menu.classList.toggle("hidden");
            };
        }
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

            console.log("ADMIN?", isAdmin);

        if (data.user) {
            currentUser = data.user;

            console.log("👤 Usuario:", currentUser.email);
            console.log(currentUser.raw_user_meta_data);

            const ADMIN_ID = "bfdc7ba8-2099-419a-849d-69a5bbff62ab";
                isAdmin = currentUser.id === ADMIN_ID;

            console.log("USER ID:", currentUser.id);
            console.log("ADMIN?", isAdmin);

            const name =
                currentUser.user_metadata?.username ||
                currentUser.raw_user_meta_data?.username ||
                currentUser.email;

            console.log("USERNAME META:", currentUser.user_metadata);
            console.log("RAW META:", currentUser.raw_user_meta_data);

            const display = document.getElementById("usernameDisplay");

            if (display) {
                display.textContent = name;
                display.classList.remove("hidden");
            }
        }
    }

    async function logout() {
        console.log("🚪 Cerrando sesión...");

        await supabase.auth.signOut();

        currentUser = null;
        isAdmin = false;

        // 🔴 OCULTAR MENÚ
        const menu = document.getElementById("userMenu");
        if (menu) menu.classList.add("hidden");

        // 🔴 LIMPIAR NOMBRE
        const display = document.getElementById("usernameDisplay");
        if (display) {
            display.textContent = "";
            display.classList.add("hidden");
        }

        goToPage("inicio");

        console.log("✅ Sesión cerrada");
    }

    /* ================= RECETAS ADMIN ================= */

    //AÑADIR RECETAS
    async function saveRecipe() {
        if (!currentUser) return alert("Inicia sesión");

        const name = document.getElementById("rName").value;
        const category = document.getElementById("rCategory").value;
        const ingredients = document.getElementById("rIngredients").value;
        const preparation = document.getElementById("rPreparation").value;
        const file = document.getElementById("rImage").files[0];

        if (!name || !ingredients || !preparation)
            return alert("Completa los campos");

        let imageUrl = null;

        // 🔥 SUBIR IMAGEN A SUPABASE
        if (file) {
            const fileName = `recipe-${Date.now()}`;

            const { error } = await supabase.storage
                .from("recipe-images") // ⚠️ asegúrate que este bucket exista
                .upload(fileName, file);

            if (error) {
                console.error(error);
                return alert("Error subiendo imagen");
            }

            const { data } = supabase.storage
                .from("recipe-images")
                .getPublicUrl(fileName);

            imageUrl = data.publicUrl;
        }

        // 🔥 INSERTAR EN BD
        const { error } = await supabase.from("recipes").insert([{
            name,
            category,
            ingredients,
            preparation,
            image: imageUrl
        }]);

        if (error) {
            console.error(error);
            return alert("Error guardando receta");
        }
            alert("Receta creada 💜");
        await loadRecipes();
        goToPage("recetario");
    }

    // EDITAR RECETAS
    async function updateRecipe(id) {
        if (!currentUser) return alert("Inicia sesión");

        const name = document.getElementById("rName").value;
        const category = document.getElementById("rCategory").value;
        const ingredients = document.getElementById("rIngredients").value;
        const preparation = document.getElementById("rPreparation").value;
        const file = document.getElementById("rImage").files[0];

        let imageUrl = null;

        // 🔥 SI SUBE NUEVA IMAGEN
        if (file) {
            const fileName = `recipe-${Date.now()}`;

            const { error } = await supabase.storage
                .from("recipe-images")
                .upload(fileName, file);

            if (error) {
                console.error(error);
                return alert("Error subiendo imagen");
            }

            const { data } = supabase.storage
                .from("recipe-images")
                .getPublicUrl(fileName);

            imageUrl = data.publicUrl;
        }

        // 🔥 OBJETO A ACTUALIZAR
        const updateData = {
            name,
            category,
            ingredients,
            preparation
        };

        // solo actualizar imagen si hay nueva
        if (imageUrl) updateData.image = imageUrl;

        const { error } = await supabase
            .from("recipes")
            .update(updateData)
            .eq("id", id);

        if (error) {
            console.error(error);
            return alert("Error actualizando receta");
        }

        alert("Receta actualizada ✨");

        await loadRecipes();
        goToPage("recetario");
    }
    
    //ELIMINAR RECETAS
    async function deleteRecipe(id) {

    if (!currentUser) return alert("Inicia sesión");

    const confirmDelete = confirm("¿Eliminar esta receta?");
    if (!confirmDelete) return;

    // 🔥 1. eliminar likes relacionados
    const { error: likeError } = await supabase
        .from("recipe_likes")
        .delete()
        .eq("recipe_id", id);

    if (likeError) {
        console.error(likeError);
        return alert("Error eliminando likes");
    }

    // 🔥 2. eliminar receta
    const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        return alert("Error al eliminar receta");
    }

    alert("Receta eliminada 🗑");

    await loadRecipes();
    await loadLikes(); // importante
    goToPage("recetario");
}

    /* ================= POSTSSSS ================= */
// AÑADIR PUBLICACIONESSSSS
    async function createPost() {

        if (!currentUser) return alert("Inicia sesión 💜");

        const text = document.getElementById("postText").value;
        const file = document.getElementById("postImage").files[0];

        if (!text) return alert("Escribe algo");

        let imageUrl = null;

        // 🔥 SUBIR IMAGEN
        if (file) {
            const fileName = `post-${Date.now()}`;

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

        // 🔥 INSERTAR POST
        const { error } = await supabase.from("posts").insert([{
            user_id: currentUser.id,
            username: 
                currentUser.user_metadata?.username ||
                currentUser.raw_user_meta_data?.username ||
                currentUser.email,
            content: text,
            image: imageUrl
        }]);

        if (error) {
            console.error(error);
            return alert("Error creando post");
        }

        alert("Publicado 💜");

        await loadPosts();
        goToPage("blog");
    }

    // ACTUALIZAR PUBLICACIONESSS
    async function updatePost(id) {
        if (!currentUser) return alert("Inicia sesión");

        const text = document.getElementById("editPostText").value;
        const file = document.getElementById("editPostImage").files[0];

        let imageUrl = null;

        // 🔥 nueva imagen
        if (file) {
            const fileName = `post-${Date.now()}`;

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

        const updateData = { content: text };

        if (imageUrl) updateData.image = imageUrl;

        const { error } = await supabase
            .from("posts")
            .update(updateData)
            .eq("id", id);

        if (error) {
            console.error(error);
            return alert("Error actualizando post");
        }

        alert("Post actualizado ✨");

        await loadPosts();
        goToPage("blog");
    }

// ELIMINAR PUBLICACIONES
    async function deletePost(id) {

    console.log("🗑 Intentando eliminar post:", id);

    if (!currentUser) {
        console.log("❌ No hay usuario");
        return alert("Inicia sesión");
    }

    console.log("👤 Usuario actual:", currentUser.id);

    const confirmDelete = confirm("¿Eliminar esta publicación?");
    if (!confirmDelete) {
        console.log("❌ Cancelado por usuario");
        return;
    }

    // 🔥 ELIMINAR LIKES
    const { error: likeError } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", id);

    console.log("🧹 Eliminando likes...");

    if (likeError) {
        console.error("❌ Error likes:", likeError);
        return alert("Error eliminando likes");
    }

    console.log("✅ Likes eliminados");

    // 🔥 ELIMINAR POST
    const { data, error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id)
        .select(); // 👈 IMPORTANTE para ver qué borra

    console.log("📦 Resultado delete:", data);

    if (error) {
        console.error("❌ Error eliminando post:", error);
        return alert("Error eliminando publicación");
    }

    if (!data || data.length === 0) {
        console.warn("⚠️ No se eliminó nada (policy probablemente bloqueando)");
        return alert("No tienes permiso para eliminar este post");
    }

    console.log("✅ Post eliminado correctamente");

    alert("Publicación eliminada 🗑");

    await loadPosts();
    await loadLikes();

    goToPage("blog");
}


    /* ================= DATA ================= */
    async function loadRecipes() {
        const { data } = await supabase.from("recipes").select("*");
        recipes = data || [];
    }

    async function loadPosts() {
        const { data } = await supabase
            .from("posts")
            .select("*")
            .order("created_at", { ascending: false });
        posts = data || [];
    }

    async function loadLikes() {
        const { data: p } = await supabase.from("post_likes").select("*");
        const { data: r } = await supabase.from("recipe_likes").select("*");

        postLikes = p || [];
        recipeLikes = r || [];
    }

    /* ================= LIKES ================= */
    async function togglePostLike(postId) {

        if (!currentUser) return alert("Inicia sesión");

        const existing = postLikes.find(l =>
            l.post_id == postId && l.user_id == currentUser.id
        );

        if (existing) {
            await supabase.from("post_likes").delete().eq("id", existing.id);
        } else {
            await supabase.from("post_likes").insert([{
                post_id: postId,
                user_id: currentUser.id
            }]);
        }

        await loadLikes();
        goToPage("blog");
    }

    async function toggleRecipeLike(recipeId) {

        if (!currentUser) return alert("Inicia sesión");

        const existing = recipeLikes.find(l =>
            l.recipe_id == recipeId && l.user_id == currentUser.id
        );

        if (existing) {
            await supabase.from("recipe_likes").delete().eq("id", existing.id);
        } else {
            await supabase.from("recipe_likes").insert([{
                recipe_id: recipeId,
                user_id: currentUser.id
            }]);
        }

        await loadLikes();
        goToPage("recetario");
    }

    /* ================= NAV ================= */
    function goToPage(page) {

        currentPage = page;

        navButtons.forEach(b => b.classList.remove("active"));
        document.querySelector(`[data-page="${page}"]`)?.classList.add("active");

        renderPage(page);
    }

    function renderPage(page) {

        let html = "";

        if (page === "inicio") {
            html = `
            <div class="home-hero">
                <h1>🍰 JAMM</h1>
                <button id="exploreBtn">Explorar</button>
                <button id="installBtn">Instalar App</button>
            </div>
            <div id="homeGrid" class="grid-4"></div>`;
        }

        if (page === "recetario") {
            html = `
            <h2>Recetario</h2>
            ${isAdmin ? `<button id="addRecipeBtn">+ Añadir receta</button>` : ""}
            <div id="recetario" class="grid-4"></div>`;
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
                            <textarea id="postText" placeholder="¿Qué quieres compartir? 💜"></textarea>
                            <input type="file" id="postImage">
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

            </div>`;
        }

        pageContent.innerHTML = html;

        if (page === "inicio") initHome();
        if (page === "recetario") initRecetario();
        if (page === "blog") initBlog();
    }

    /* ================= UI ================= */
    function renderEditPost(id) {

        const p = posts.find(x => x.id == id);
        if (!p) return;

        pageContent.innerHTML = `
        <div class="card form-card">

            <h2>✏️ Editar publicación</h2>

            ${p.image ? `<img src="${p.image}" class="preview-img">` : ""}

            <textarea id="editPostText">${p.content}</textarea>

            <input type="file" id="editPostImage">

            <button id="updatePost" data-id="${p.id}">Actualizar</button>
            <button id="backBtn">Cancelar</button>

        </div>
        `;
    }

    function renderAddRecipe() {
        pageContent.innerHTML = `
        <div class="card form-card">
            <h2>➕ Nueva receta</h2>

            <input id="rName" placeholder="Nombre de la receta">

            <input id="rCategory" placeholder="Categoría">

            <textarea id="rIngredients" placeholder="Ingredientes"></textarea>

            <textarea id="rPreparation" placeholder="Preparación"></textarea>

            <input type="file" id="rImage">

            <button id="saveRecipe">Guardar receta</button>
            <button id="backBtn">Cancelar</button>

        </div>
        `;
    }

    function recipeCard(r) {

        const likes = recipeLikes.filter(l => l.recipe_id == r.id).length;

        return `
        <div class="card recipe-card">

            <img src="${r.image || ''}" class="recipe-img">

            <h4>${r.name}</h4>
            <p>${r.category || "Sin categoría"}</p>

            <button class="view-btn" data-id="${r.id}">Ver más</button>

            <button class="like-recipe" data-id="${r.id}">
                ❤️ ${likes}
            </button>

            ${isAdmin ? `
                <button class="edit-recipe" data-id="${r.id}">✏️ Editar</button>
                <button class="delete-recipe" data-id="${r.id}">🗑</button>
            ` : ""}

        </div>`;
    }

    function editRecipeForm(id) {

        const r = recipes.find(x => x.id == id);
        if (!r) return;

        pageContent.innerHTML = `
        <div class="card form-card">

            <h2>✏️ Editar receta</h2>

            ${r.image ? `<img src="${r.image}" class="preview-img">` : ""}

            <input id="rName" value="${r.name}">
            <input id="rCategory" value="${r.category || ""}">

            <textarea id="rIngredients">${r.ingredients}</textarea>
            <textarea id="rPreparation">${r.preparation}</textarea>

            <input type="file" id="rImage">

            <button id="updateRecipe" data-id="${r.id}">Actualizar</button>
            <button id="backBtn">Cancelar</button>

        </div>
        `;
    }

    function initHome() {
        const c = document.getElementById("homeGrid");
        if (!c) return;
        c.innerHTML = recipes.slice(0, 4).map(recipeCard).join("");
    }

    function initRecetario() {
        const c = document.getElementById("recetario");
        if (!c) return;
        c.innerHTML = recipes.map(recipeCard).join("");
    }

    function initBlog() {
        const c = document.getElementById("postsContainer");
        if (!c) return;

        c.innerHTML = posts.map(p => `
            <div class="card blog-post">

                ${p.image ? `<img src="${p.image}" class="post-img">` : ""}

                <div>
                    <h4>${p.username}</h4>
                    <p>${p.content}</p>

                    <button class="like-post" data-id="${p.id}">
                        ❤️ ${postLikes.filter(l => l.post_id == p.id).length}
                    </button>

                    ${(p.user_id === currentUser?.id) ? `
                        <button class="edit-post" data-id="${p.id}">✏️</button>
                    ` : ""}

                    ${(p.user_id === currentUser?.id || isAdmin) ? `
                        <button class="delete-post" data-id="${p.id}">🗑</button>
                    ` : ""}

                </div>
            </div>
        `).join("");
    }

    function renderDetail(id) {

        const r = recipes.find(x => x.id == id);
        if (!r) return;

        pageContent.innerHTML = `
        <button id="backBtn">⬅ Volver</button>

        <div class="card detail-layout">

            <div>
                <img src="${r.image}" class="detail-img">
                <h4>Ingredientes</h4>
                <p>${r.ingredients}</p>
            </div>

            <div>
                <h2>${r.name}</h2>
                <h4>Categoría</h4>
                <p>${r.category || "Sin categoría"}</p>
                <h4>Preparación</h4>
                <p>${r.preparation}</p>
            </div>

        </div>`;
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

});