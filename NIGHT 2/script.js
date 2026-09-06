// =====================================
// NIGHT 01™ — SHOP LOGIC
// =====================================

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------------------------
     DATA
  --------------------------------- */
  const PRODUCTS = [
    { id:0, name:"NIGHT PATH TEE", price:64.99, oldPrice:null, colors:["#f5f5f5"], sizes:["S","M","L","XL"], badge:"NEW", print:"NIGHT",
      photos:[typeof imgFlatWhite!=="undefined"?imgFlatWhite:null, typeof imgBackBold!=="undefined"?imgBackBold:null, typeof imgBackSoft!=="undefined"?imgBackSoft:null, typeof imgFlatNoBg!=="undefined"?imgFlatNoBg:null].filter(Boolean) },
    { id:-1, name:"NIGHT LOGO TEE", price:49.99, oldPrice:null, colors:["#f5f5f5"], sizes:["S","M","L","XL"], badge:null, print:"NIGHT",
      photos:[typeof imgFront!=="undefined"?imgFront:null].filter(Boolean) },
    { id:1, name:"NIGHT STATEMENT TEE", price:59.99, oldPrice:null, colors:["#0a0a0a","#2b2b2b"], sizes:["S","M","L","XL"], badge:"NEW", print:"NIGHT" },
    { id:2, name:"NIGHT LOGO TEE", price:49.99, oldPrice:null, colors:["#f5f5f5","#0a0a0a"], sizes:["S","M","L"], badge:null, print:"01™" },
    { id:3, name:"NIGHT WASHED TEE", price:54.99, oldPrice:64.99, colors:["#8a8a8a","#2b2b2b"], sizes:["M","L","XL"], badge:"SALE", print:"NIGHT" },
    { id:4, name:"NIGHT OVERSIZE TEE", price:69.99, oldPrice:null, colors:["#0a0a0a","#f5f5f5"], sizes:["S","M","L","XL"], badge:"NEW", print:"OS" },
    { id:5, name:"NIGHT PAINT TEE", price:64.99, oldPrice:null, colors:["#2b2b2b","#8a8a8a"], sizes:["S","M","L"], badge:null, print:"NIGHT" },
    { id:6, name:"NIGHT CORE TEE", price:52.99, oldPrice:null, colors:["#0a0a0a"], sizes:["S","M","L","XL"], badge:null, print:"CORE" },
    { id:7, name:"NIGHT ECLIPSE TEE", price:58.99, oldPrice:69.99, colors:["#0a0a0a","#8a8a8a"], sizes:["M","L","XL"], badge:"SALE", print:"01™" },
    { id:8, name:"NIGHT RIDGE TEE", price:56.99, oldPrice:null, colors:["#f5f5f5","#2b2b2b"], sizes:["S","M","L"], badge:null, print:"RIDGE" },
  ];

  // per-product current selection
  const state = {};
  PRODUCTS.forEach(p => { state[p.id] = { color:p.colors[0], size:p.sizes[Math.floor(p.sizes.length/2)], photoIndex:0 }; });

  let activeColor = "all";
  let activeSort = "default";

  /* ---------------------------------
     WISHLIST (localStorage)
  --------------------------------- */
  let wishlist = JSON.parse(localStorage.getItem("night_wishlist") || "[]");
  function saveWishlist(){ localStorage.setItem("night_wishlist", JSON.stringify(wishlist)); }
  function isWished(id){ return wishlist.includes(id); }
  function toggleWish(id){
    if(isWished(id)) wishlist = wishlist.filter(x=>x!==id);
    else wishlist.push(id);
    saveWishlist();
    renderGrid();
    renderWishlist();
    bump("wishCount");
  }

  /* ---------------------------------
     CART (localStorage)
  --------------------------------- */
  let cart = JSON.parse(localStorage.getItem("night_cart") || "[]");
  function saveCart(){ localStorage.setItem("night_cart", JSON.stringify(cart)); }

  function addToCart(id, color, size){
    const p = PRODUCTS.find(x=>x.id===id);
    if(!p) return;
    const photo = (p.photos && p.photos.length) ? p.photos[state[id].photoIndex || 0] : null;
    const existing = cart.find(i => i.id===id && i.color===color && i.size===size);
    if(existing) existing.qty += 1;
    else cart.push({ id, name:p.name, price:p.price, color, size, print:p.print, photo, qty:1 });
    saveCart(); renderCart(); bump("cartCount");
  }
  function changeQty(idx, delta){
    cart[idx].qty += delta;
    if(cart[idx].qty <= 0) cart.splice(idx,1);
    saveCart(); renderCart();
  }
  function removeFromCart(idx){ cart.splice(idx,1); saveCart(); renderCart(); }
  function cartTotal(){ return cart.reduce((s,i)=>s+i.price*i.qty,0); }
  function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }

  function bump(elId){
    const el = document.getElementById(elId);
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }

  function fmt(n){ return "$" + n.toFixed(2).replace(/\.00$/,""); }

  /* ---------------------------------
     SVG TEE RENDER
  --------------------------------- */
  function teeSVG(color, print, size){
    return `
      <svg viewBox="0 0 400 460" style="color:${color};width:${size||150}px">
        <use href="#tee-shape"></use>
      </svg>
      <div class="product-print" style="color:${textColorFor(color)}">${print}</div>
    `;
  }
  function textColorFor(hex){
    const c = hex.replace("#","");
    const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    const brightness = (r*299 + g*587 + b*114) / 1000;
    return brightness > 150 ? "rgba(5,5,5,.7)" : "rgba(255,255,255,.8)";
  }

  // returns either a real product photo (if the product has one) or the SVG mockup
  function visualFor(p, s, photoIdx){
    if(p.photos && p.photos.length){
      const idx = photoIdx != null ? photoIdx : 0;
      return `<img class="product-photo" src="${p.photos[idx]}" alt="${p.name}">`;
    }
    return teeSVG(s.color, p.print);
  }
  function thumbFor(p, photoIdx){
    if(p.photos && p.photos.length){
      const idx = photoIdx != null ? photoIdx : 0;
      return `<img class="product-photo" src="${p.photos[idx]}" alt="${p.name}">`;
    }
    return teeSVG(p._color, p.print, 44);
  }

  /* ---------------------------------
     CART RENDER
  --------------------------------- */
  function renderCart(){
    const itemsEl = document.getElementById("cartItems");
    const emptyEl = document.getElementById("cartEmpty");
    const footerEl = document.getElementById("cartFooter");
    document.getElementById("cartCount").textContent = cartCount();

    if(cart.length === 0){
      itemsEl.innerHTML = ""; itemsEl.appendChild(emptyEl);
      emptyEl.style.display = "block"; footerEl.style.display = "none";
      return;
    }
    footerEl.style.display = "block";
    itemsEl.innerHTML = cart.map((item, idx) => `
      <div class="cart-item">
        <div class="cart-item-visual">${item.photo ? `<img class="product-photo" src="${item.photo}" alt="${item.name}">` : teeSVG(item.color, item.print, 44)}</div>
        <div class="cart-item-info">
          <h5>${item.name}</h5>
          <div class="cart-item-meta">SIZE ${item.size}</div>
          <div class="cart-item-controls">
            <div class="qty-control">
              <button data-action="dec" data-idx="${idx}">−</button>
              <span>${item.qty}</span>
              <button data-action="inc" data-idx="${idx}">+</button>
            </div>
            <span class="cart-item-price">${fmt(item.price*item.qty)}</span>
          </div>
          <button class="remove-item" data-action="remove" data-idx="${idx}">Remove</button>
        </div>
      </div>
    `).join("");
    document.getElementById("cartTotal").textContent = fmt(cartTotal());

    itemsEl.querySelectorAll("[data-action]").forEach(btn=>{
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx), action = btn.dataset.action;
        if(action==="inc") changeQty(idx,1);
        if(action==="dec") changeQty(idx,-1);
        if(action==="remove") removeFromCart(idx);
      });
    });
  }

  /* ---------------------------------
     WISHLIST RENDER
  --------------------------------- */
  function renderWishlist(){
    const itemsEl = document.getElementById("wishlistItems");
    const emptyEl = document.getElementById("wishlistEmpty");
    document.getElementById("wishCount").textContent = wishlist.length;

    if(wishlist.length === 0){
      itemsEl.innerHTML = ""; itemsEl.appendChild(emptyEl); emptyEl.style.display = "block";
      return;
    }
    itemsEl.innerHTML = wishlist.map(id => {
      const p = PRODUCTS.find(x=>x.id===id);
      if(!p) return "";
      const s = state[id];
      const visual = (p.photos && p.photos.length) ? `<img class="product-photo" src="${p.photos[s.photoIndex||0]}" alt="${p.name}">` : teeSVG(s.color, p.print, 44);
      return `
      <div class="cart-item">
        <div class="cart-item-visual">${visual}</div>
        <div class="cart-item-info">
          <h5>${p.name}</h5>
          <div class="cart-item-meta">${fmt(p.price)}</div>
          <button class="remove-item wish-remove" data-action="unwish" data-id="${id}">Remove</button>
        </div>
      </div>`;
    }).join("");

    itemsEl.querySelectorAll('[data-action="unwish"]').forEach(btn=>{
      btn.addEventListener("click", ()=> toggleWish(parseInt(btn.dataset.id)));
    });
  }

  /* ---------------------------------
     PRODUCT GRID
  --------------------------------- */
  function getFilteredSorted(){
    let list = [...PRODUCTS];
    if(activeColor !== "all") list = list.filter(p => p.colors.includes(activeColor));
    if(activeSort === "price-asc") list.sort((a,b)=>a.price-b.price);
    if(activeSort === "price-desc") list.sort((a,b)=>b.price-a.price);
    if(activeSort === "name") list.sort((a,b)=>a.name.localeCompare(b.name));
    return list;
  }

  function renderGrid(){
    const grid = document.getElementById("productGrid");
    const empty = document.getElementById("catalogEmpty");
    const list = getFilteredSorted();

    if(list.length === 0){ grid.innerHTML = ""; empty.style.display = "block"; return; }
    empty.style.display = "none";

    grid.innerHTML = list.map(p => {
      const s = state[p.id];
      const isPhoto = p.photos && p.photos.length;
      const badge = p.badge ? `<span class="product-badge" style="position:absolute;top:16px;left:16px;font-family:var(--mono);font-size:10px;font-weight:700;padding:6px 12px;border:1px solid #fff;letter-spacing:1px;z-index:2">${p.badge}</span>` : "";
      const swatchesRow = isPhoto
        ? `<p class="product-cat" style="margin-bottom:14px">${p.photos.length>1 ? p.photos.length+" ANGLES" : "SIGNATURE PRINT"}</p>`
        : `<div class="swatches">${p.colors.map(c=>`<button class="swatch ${c===s.color?'active':''}" style="--c:${c}" data-action="color" data-id="${p.id}" data-color="${c}"></button>`).join("")}</div>`;
      return `
      <div class="product-card reveal ${isPhoto?'photo-card':''}" data-id="${p.id}">
        ${badge}
        <button class="wish-btn ${isWished(p.id)?'active':''}" data-action="wish" data-id="${p.id}">♥</button>
        <div class="product-visual ${isPhoto?'has-photo':''}" data-action="quickview" data-id="${p.id}">${visualFor(p, s, s.photoIndex)}</div>
        <h3>${p.name}</h3>
        <p class="product-cat">TEE / NIGHT 01™</p>
        <div class="price-row">
          <span class="price-now">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ""}
        </div>
        ${swatchesRow}
        <div class="size-row">
          ${p.sizes.map(sz=>`<button class="size-btn ${sz===s.size?'active':''}" data-action="size" data-id="${p.id}" data-size="${sz}">${sz}</button>`).join("")}
        </div>
        <button class="add-cart-btn" data-action="add" data-id="${p.id}">ADD TO CART</button>
      </div>`;
    }).join("");

    bindGridEvents();
    initReveal();
  }

  function bindGridEvents(){
    document.querySelectorAll('[data-action="color"]').forEach(btn=>{
      btn.addEventListener("click", ()=>{ state[parseInt(btn.dataset.id)].color = btn.dataset.color; renderGrid(); renderSidebar(); });
    });
    document.querySelectorAll('[data-action="size"]').forEach(btn=>{
      btn.addEventListener("click", ()=>{ state[parseInt(btn.dataset.id)].size = btn.dataset.size; renderGrid(); });
    });
    document.querySelectorAll('[data-action="add"]').forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = parseInt(btn.dataset.id);
        addToCart(id, state[id].color, state[id].size);
        btn.textContent = "ADDED ✓"; btn.classList.add("added");
        showToast(`${PRODUCTS.find(p=>p.id===id).name} added to cart`);
        setTimeout(()=>{ btn.textContent = "ADD TO CART"; btn.classList.remove("added"); }, 1500);
      });
    });
    document.querySelectorAll('[data-action="quickview"]').forEach(el=>{
      el.addEventListener("click", ()=> openQuickView(parseInt(el.dataset.id)));
    });
    document.querySelectorAll('[data-action="wish"]').forEach(btn=>{
      btn.addEventListener("click", (e)=>{ e.stopPropagation(); toggleWish(parseInt(btn.dataset.id)); });
    });
  }

  /* ---------------------------------
     SIDEBAR (featured + mini list)
  --------------------------------- */
  function renderSidebar(){
    const featured = PRODUCTS[0];
    const fs = state[featured.id];
    document.getElementById("sidebarFeatured").innerHTML = `
      <div class="sp-visual">${visualFor(featured, fs, fs.photoIndex)}</div>
      <h4>${featured.name}</h4>
      <span>${fmt(featured.price)}</span>
    `;
    document.getElementById("sidebarFeatured").addEventListener("click", ()=> openQuickView(featured.id));

    const rest = PRODUCTS.slice(1,4);
    document.getElementById("sidebarList").innerHTML = rest.map(p=>{
      const s = state[p.id];
      return `
      <div class="mini-product" data-id="${p.id}">
        <div class="mini-visual">${visualFor(p, s, s.photoIndex)}</div>
        <div><h5>${p.name}</h5><span>${fmt(p.price)}</span></div>
      </div>`;
    }).join("");
    document.querySelectorAll(".mini-product").forEach(el=>{
      el.addEventListener("click", ()=> openQuickView(parseInt(el.dataset.id)));
    });
  }

  /* ---------------------------------
     QUICK VIEW MODAL
  --------------------------------- */
  function openQuickView(id){
    const p = PRODUCTS.find(x=>x.id===id);
    const s = state[id];
    const isPhoto = p.photos && p.photos.length;
    const body = document.getElementById("quickViewBody");

    const visual = isPhoto ? visualFor(p, s, s.photoIndex) : teeSVG(s.color, p.print, 210);
    const gallery = (isPhoto && p.photos.length > 1) ? `
      <div class="pm-thumbs">
        ${p.photos.map((ph,i)=>`<button class="pm-thumb ${i===s.photoIndex?'active':''}" data-action="pm-photo" data-idx="${i}"><img src="${ph}" alt="${p.name} view ${i+1}"></button>`).join("")}
      </div>` : "";
    const optionsRow = isPhoto
      ? `<p class="product-cat" style="margin-bottom:14px">${p.photos.length>1 ? p.photos.length+" ANGLES AVAILABLE" : "SIGNATURE PRINT"}</p>`
      : `<div class="swatches">${p.colors.map(c=>`<button class="swatch ${c===s.color?'active':''}" style="--c:${c}" data-action="pm-color" data-color="${c}"></button>`).join("")}</div>`;

    body.innerHTML = `
      <div>
        <div class="pm-visual">${visual}</div>
        ${gallery}
      </div>
      <div class="pm-info">
        <p class="product-cat">TEE / NIGHT 01™</p>
        <h3>${p.name}</h3>
        <div class="price-row">
          <span class="price-now">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ""}
        </div>
        <p class="pm-desc">Heavyweight 260g cotton, boxy fit, screen-printed graphic. Built to move with you from the street to the summit.</p>
        ${optionsRow}
        <div class="size-row">
          ${p.sizes.map(sz=>`<button class="size-btn ${sz===s.size?'active':''}" data-action="pm-size" data-size="${sz}">${sz}</button>`).join("")}
        </div>
        <button class="add-cart-btn" id="pmAddBtn">ADD TO CART</button>
      </div>`;

    body.querySelectorAll('[data-action="pm-color"]').forEach(btn=>{
      btn.addEventListener("click", ()=>{ state[id].color = btn.dataset.color; openQuickView(id); });
    });
    body.querySelectorAll('[data-action="pm-photo"]').forEach(btn=>{
      btn.addEventListener("click", ()=>{ state[id].photoIndex = parseInt(btn.dataset.idx); openQuickView(id); });
    });
    body.querySelectorAll('[data-action="pm-size"]').forEach(btn=>{
      btn.addEventListener("click", ()=>{ state[id].size = btn.dataset.size; openQuickView(id); });
    });
    document.getElementById("pmAddBtn").addEventListener("click", ()=>{
      addToCart(id, state[id].color, state[id].size);
      showToast(`${p.name} added to cart`);
      closeModal(document.getElementById("quickView"));
    });
    openModal(document.getElementById("quickView"));
  }

  /* ---------------------------------
     FILTERS & SORT
  --------------------------------- */
  document.querySelectorAll("#colorFilters .color-filter").forEach(btn=>{
    if(btn.dataset.color !== "all"){
      btn.style.background = btn.dataset.color;
      if(btn.dataset.color === "#0a0a0a") btn.style.borderColor = "#444";
    }
    btn.addEventListener("click", ()=>{
      document.querySelectorAll("#colorFilters .color-filter").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      activeColor = btn.dataset.color;
      renderGrid();
    });
  });

  document.getElementById("sortSelect").addEventListener("change", (e)=>{
    activeSort = e.target.value; renderGrid();
  });

  document.getElementById("resetFilters").addEventListener("click", ()=>{
    activeColor = "all"; activeSort = "default";
    document.querySelectorAll(".color-filter").forEach(b=>b.classList.remove("active"));
    document.querySelector('[data-color="all"]').classList.add("active");
    document.getElementById("sortSelect").value = "default";
    renderGrid();
  });

  document.getElementById("filterToggle").addEventListener("click", ()=>{
    document.getElementById("colorFilters").scrollIntoView({behavior:"smooth", block:"center"});
  });

  /* ---------------------------------
     MODAL HELPERS
  --------------------------------- */
  function openModal(modal){ modal.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeModal(modal){ modal.classList.remove("open"); document.body.style.overflow = ""; }
  document.querySelectorAll(".modal").forEach(modal=>{
    modal.addEventListener("click", (e)=>{ if(e.target === modal) closeModal(modal); });
  });
  document.getElementById("closeQuickView").addEventListener("click", ()=>closeModal(document.getElementById("quickView")));
  document.getElementById("closeCheckout").addEventListener("click", ()=>closeModal(document.getElementById("checkoutModal")));

  /* ---------------------------------
     CART / WISHLIST DRAWERS
  --------------------------------- */
  const cartDrawer = document.getElementById("cartDrawer");
  const wishlistDrawer = document.getElementById("wishlistDrawer");
  const overlay = document.getElementById("overlay");

  function openDrawer(drawer){ drawer.classList.add("open"); overlay.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeDrawers(){
    cartDrawer.classList.remove("open");
    wishlistDrawer.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
  document.getElementById("cartBtn").addEventListener("click", ()=> openDrawer(cartDrawer));
  document.getElementById("closeCart").addEventListener("click", closeDrawers);
  document.getElementById("wishlistBtn").addEventListener("click", ()=> openDrawer(wishlistDrawer));
  document.getElementById("closeWishlist").addEventListener("click", closeDrawers);
  overlay.addEventListener("click", ()=>{
    closeDrawers();
    closeModal(document.getElementById("quickView"));
    closeModal(document.getElementById("checkoutModal"));
  });

  /* ---------------------------------
     CHECKOUT
  --------------------------------- */
  document.getElementById("checkoutBtn").addEventListener("click", ()=>{
    if(cart.length === 0) return;
    document.getElementById("checkoutTotal").textContent = fmt(cartTotal());
    document.getElementById("checkoutStep1").style.display = "block";
    document.getElementById("checkoutStep2").style.display = "none";
    closeDrawers();
    openModal(document.getElementById("checkoutModal"));
  });

  document.getElementById("checkoutForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = document.getElementById("ckName").value.trim();
    document.getElementById("successText").textContent = `Thanks, ${name}! We'll text you once your order ships.`;
    document.getElementById("checkoutStep1").style.display = "none";
    document.getElementById("checkoutStep2").style.display = "block";
    cart = []; saveCart(); renderCart();
  });
  document.getElementById("closeSuccess").addEventListener("click", ()=> closeModal(document.getElementById("checkoutModal")));

  /* ---------------------------------
     NEWSLETTER
  --------------------------------- */
  document.getElementById("newsletterForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const email = document.getElementById("newsletterEmail").value;
    document.getElementById("newsletterMsg").textContent = `You're on the list — code sent to ${email}`;
    document.getElementById("newsletterEmail").value = "";
  });

  /* ---------------------------------
     SEARCH
  --------------------------------- */
  const searchOverlay = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");
  document.getElementById("searchBtn").addEventListener("click", ()=>{
    searchOverlay.classList.add("open");
    setTimeout(()=>searchInput.focus(), 300);
  });
  document.getElementById("closeSearch").addEventListener("click", ()=> searchOverlay.classList.remove("open"));

  searchInput.addEventListener("input", ()=>{
    const q = searchInput.value.trim().toLowerCase();
    const resultsEl = document.getElementById("searchResults");
    if(q.length < 1){ resultsEl.innerHTML = ""; return; }
    const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
    resultsEl.innerHTML = matches.map(p => `
      <div class="sr-item" data-id="${p.id}"><span>${p.name}</span><span>${fmt(p.price)}</span></div>
    `).join("") || `<p style="color:var(--gray);text-align:center;padding:20px">No results</p>`;
    resultsEl.querySelectorAll(".sr-item").forEach(item=>{
      item.addEventListener("click", ()=>{
        searchOverlay.classList.remove("open");
        openQuickView(parseInt(item.dataset.id));
      });
    });
  });

  /* ---------------------------------
     TOAST
  --------------------------------- */
  let toastTimer;
  function showToast(msg){
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toast.classList.remove("show"), 2600);
  }

  /* ---------------------------------
     MOBILE MENU
  --------------------------------- */
  const burger = document.getElementById("burgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  burger.addEventListener("click", ()=>{
    burger.classList.toggle("open");
    mobileMenu.classList.toggle("open");
  });

  /* ---------------------------------
     SMOOTH SCROLL + ACTIVE NAV
  --------------------------------- */
  document.querySelectorAll("[data-scroll]").forEach(link=>{
    link.addEventListener("click", (e)=>{
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if(target) target.scrollIntoView({ behavior:"smooth" });
      burger.classList.remove("open");
      mobileMenu.classList.remove("open");
    });
  });

  const navLinks = document.querySelectorAll("nav a[data-scroll]");
  const sections = [...navLinks].map(l=>document.querySelector(l.getAttribute("href"))).filter(Boolean);
  function updateActiveNav(){
    let current = sections[0];
    sections.forEach(sec=>{ if(sec.getBoundingClientRect().top < window.innerHeight*0.4) current = sec; });
    navLinks.forEach(l=> l.classList.toggle("active", l.getAttribute("href") === "#"+current.id));
  }

  /* ---------------------------------
     REVEAL ON SCROLL
  --------------------------------- */
  function initReveal(){
    document.querySelectorAll(".reveal").forEach(el=>{
      if(el.getBoundingClientRect().top < window.innerHeight - 60) el.classList.add("in");
    });
  }
  function reveal(){
    document.querySelectorAll(".reveal:not(.in)").forEach(el=>{
      if(el.getBoundingClientRect().top < window.innerHeight - 60) el.classList.add("in");
    });
  }
  document.querySelectorAll(".about, .features, .lookbook, .newsletter, .feature, .look-card, .stats-strip, .stat-item, .testimonials, .testi-card, .faq")
    .forEach(el=>el.classList.add("reveal"));

  window.addEventListener("scroll", ()=>{ updateActiveNav(); reveal(); });

  /* ---------------------------------
     FAQ ACCORDION
  --------------------------------- */
  document.querySelectorAll(".faq-question").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const item = btn.closest(".faq-item");
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(i=>i.classList.remove("open"));
      if(!wasOpen) item.classList.add("open");
    });
  });

  /* ---------------------------------
     BACK TO TOP / YEAR
  --------------------------------- */
  document.getElementById("topBtn").addEventListener("click", ()=> window.scrollTo({top:0, behavior:"smooth"}));
  document.querySelector(".year").textContent = new Date().getFullYear();

  /* ---------------------------------
     PRELOADER
  --------------------------------- */
  window.addEventListener("load", ()=> setTimeout(()=>document.getElementById("preloader").classList.add("hide"), 400));
  setTimeout(()=> document.getElementById("preloader").classList.add("hide"), 1800);

  /* ---------------------------------
     PRODUCT CARD 3D TILT (desktop only)
  --------------------------------- */
  document.addEventListener("mousemove", (e)=>{
    const card = e.target.closest(".product-card, .feature");
    if(!card || window.innerWidth < 1000) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const rotateX = (y - rect.height/2)/22;
    const rotateY = (rect.width/2 - x)/22;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });
  document.addEventListener("mouseleave", (e)=>{
    if(e.target.matches && (e.target.matches(".product-card") || e.target.matches(".feature"))){
      e.target.style.transform = "translateY(0)";
    }
  }, true);

  /* ---------------------------------
     HERO SHIRT PHOTO
  --------------------------------- */
  const heroImg = document.getElementById("heroShirtImg");
  if(heroImg){
    if(typeof imgFlatNoBg !== "undefined") heroImg.src = imgFlatNoBg;
    else if(typeof imgFlatWhite !== "undefined") heroImg.src = imgFlatWhite;
    heroImg.addEventListener("click", ()=> openQuickView(0));
  }

  /* ---------------------------------
     INIT
  --------------------------------- */
  renderGrid();
  renderCart();
  renderWishlist();
  renderSidebar();
  reveal();

});
