document.addEventListener("DOMContentLoaded", () => {

    const navButtons = document.querySelectorAll(".nav-btn");
    const pageContent = document.getElementById("pageContent");

    let recipes = JSON.parse(localStorage.getItem("jamm_recipes")) || [];

    /* ================= NAV ================= */

    navButtons.forEach(btn=>{
        btn.addEventListener("click",()=>goToPage(btn.dataset.page));
    });

    function goToPage(page){
        navButtons.forEach(b=>b.classList.remove("active"));
        document.querySelector(`[data-page="${page}"]`)?.classList.add("active");
        renderPage(page);
    }

    /* ================= RENDER ================= */

    function renderPage(page){

        let content="";

        switch(page){

            case "inicio":
                content = `
                <div class="home-hero">
                    <h1>🍰 Bienvenida a JAMM</h1>
                    <p>Endulza tu día con recetas 💜</p>
                    <button id="exploreBtn">Explorar</button>
                </div>
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

        if(page==="inicio") initHome();
        if(page==="recetario") initRecetario();
        if(page==="favoritos") initFavoritos();
        if(page==="app") initInstall();
    }

    /* ================= HOME ================= */

    function initHome(){

        document.getElementById("exploreBtn")
        ?.addEventListener("click",()=>goToPage("recetario"));

        const container = document.getElementById("homeLatest");

        recipes.slice(-4).reverse().forEach(r=>{
            container.innerHTML += `
            <div class="card">
                <img src="${r.image}" class="recipe-img">
                <h4>${r.name}</h4>
            </div>`;
        });
    }

    /* ================= RECETARIO ================= */

    function initRecetario(){

        const container = document.getElementById("recetario");

        container.innerHTML = `
            <button id="add">➕ Nueva receta</button>
            <div class="grid-4"></div>
        `;

        const grid = container.querySelector(".grid-4");

        recipes.forEach(r=>{
            grid.innerHTML += `
            <div class="card">
                <img src="${r.image}" class="recipe-img">
                <h4>${r.name}</h4>
                <button class="fav" data-id="${r.id}">
                    ${r.favorite ? "💖" : "🤍"}
                </button>
                <button class="del" data-id="${r.id}">🗑</button>
            </div>`;
        });

        document.getElementById("add").onclick = renderForm;

        document.querySelectorAll(".del").forEach(btn=>{
            btn.onclick = ()=>{
                recipes = recipes.filter(r=>r.id != btn.dataset.id);
                save();
                initRecetario();
            };
        });

        document.querySelectorAll(".fav").forEach(btn=>{
            btn.onclick = ()=>{
                const r = recipes.find(x=>x.id == btn.dataset.id);
                r.favorite = !r.favorite;
                save();
                initRecetario();
            };
        });
    }

    function renderForm(){

        const container = document.getElementById("recetario");

        container.innerHTML = `
        <button id="back">⬅ Volver</button>

        <div class="card">
            <input id="name" placeholder="Nombre">
            <input id="cat" placeholder="Categoría">
            <textarea id="ing" placeholder="Ingredientes"></textarea>
            <textarea id="prep" placeholder="Preparación"></textarea>
            <input type="file" id="img">
            <button id="save">Guardar</button>
        </div>
        `;

        document.getElementById("back").onclick = initRecetario;

        document.getElementById("save").onclick = ()=>{

            const file = document.getElementById("img").files[0];
            if(!file) return alert("Selecciona imagen");

            const reader = new FileReader();

            reader.onload = e=>{
                recipes.push({
                    id: Date.now(),
                    name: name.value,
                    category: cat.value,
                    ingredients: ing.value,
                    preparation: prep.value,
                    image: e.target.result,
                    favorite:false
                });

                save();
                initRecetario();
            };

            reader.readAsDataURL(file);
        };
    }

    /* ================= FAVORITOS ================= */

    function initFavoritos(){

        const container = document.getElementById("favoritos");

        const favs = recipes.filter(r=>r.favorite);

        if(favs.length===0){
            container.innerHTML = "<p>No tienes favoritos 💜</p>";
            return;
        }

        container.innerHTML = `<div class="grid-4"></div>`;
        const grid = container.querySelector(".grid-4");

        favs.forEach(r=>{
            grid.innerHTML += `
            <div class="card">
                <img src="${r.image}" class="recipe-img">
                <h4>${r.name}</h4>
            </div>`;
        });
    }

    /* ================= PWA ================= */

    let deferredPrompt;

    window.addEventListener("beforeinstallprompt",(e)=>{
        e.preventDefault();
        deferredPrompt = e;
    });

    function initInstall(){

        const btn = document.getElementById("installBtn");

        btn.onclick = async ()=>{
            if(deferredPrompt){
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
            }else{
                alert("Usa menú del navegador 📲");
            }
        };
    }

    /* ================= STORAGE ================= */

    function save(){
        localStorage.setItem("jamm_recipes", JSON.stringify(recipes));
    }

    renderPage("inicio");
});