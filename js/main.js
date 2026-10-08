/* ===== Home page logic (runs only when <body data-page="home">) ===== */

document.addEventListener("DOMContentLoaded", function () {
  if (document.body.dataset.page !== "home") return;
  const $ = id => document.getElementById(id);

  // --- Hero carousel: auto-slide, arrows, dots, pause on hover ---
  const slides = $("slides"), total = slides.children.length;
  let current = 0, paused = false;
  $("dots").innerHTML = Array.from({ length: total }, (_, i) => `<button aria-label="Slide ${i + 1}"></button>`).join("");
  function go(n) {
    current = (n + total) % total;
    slides.style.transform = "translateX(-" + current * 100 + "%)";
    Array.from(slides.children).forEach((s, i) => s.classList.toggle("on", i === current));
    Array.from($("dots").children).forEach((d, i) => d.classList.toggle("active", i === current));
  }
  $("prev").onclick = () => go(current - 1);
  $("next").onclick = () => go(current + 1);
  $("dots").onclick = e => { const i = Array.from($("dots").children).indexOf(e.target); if (i > -1) go(i); };
  $("hero").onmouseenter = () => paused = true;
  $("hero").onmouseleave = () => paused = false;
  setInterval(() => { if (!paused) go(current + 1); }, 5000);
  go(0);

  // --- Category tiles ---
  $("cats").innerHTML = CATEGORIES.map(c => {
    const cover = PRODUCTS.find(p => p.category === c.slug);
    const src = cover ? cover.images[0] : `images/categories/${c.slug}.svg`;
    const fallback = `images/categories/${c.slug}.svg`;
    return `<a class="cat-tile" href="products.html?category=${c.slug}">
      <img class="cat-thumb" src="${src}" alt="${c.name}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'">
      <b>${c.name}</b>
    </a>`;
  }).join("");

  // --- Circular club / nation rows (placeholder logos) ---
  const slugify = n => n.toLowerCase().replace(/\s+/g, "-");
  // Club circles: for any club, drop a photo at images/clubs/<slug>.jpg (or .png) and it is
  // picked up automatically - no code changes needed. If neither is found, the drawn badge (.svg) is used.
  function clubImg(slug) {
    return `<span class="flag"><img src="images/clubs/${slug}.jpg" alt="" loading="lazy"
      onerror="this.onerror=function(){this.onerror=null;this.src='images/clubs/${slug}.svg'};this.src='images/clubs/${slug}.png'"></span>`;
  }
  const circles = (list, key, folder) => list.map(n => {
    const slug = slugify(n);
    const img = folder === "clubs" ? clubImg(slug) : `<span class="flag"><img src="images/nations/${slug}.svg" alt="${n} flag" loading="lazy"></span>`;
    return `<a class="circle" href="products.html?category=jerseys&${key}=${encodeURIComponent(n)}">${img}${n}</a>`;
  }).join("");
  $("clubs").innerHTML = circles(CLUBS, "club", "clubs");
  $("nations").innerHTML = circles(NATIONS, "nation", "nations");

  // --- Brand strip ---
  $("brands").innerHTML = '<div class="marquee">' + BRANDS.concat(BRANDS).map(b => `<span>${b}</span>`).join("") + "</div>";

  // --- Product carousels: show skeletons first, then real cards ---
  const rows = {
    deals: PRODUCTS.filter(p => p.isDeal),
    best: PRODUCTS.filter(p => p.isBestSeller),
    fresh: PRODUCTS.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12),
    reco: PRODUCTS.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12)
  };
  Object.keys(rows).forEach(k => $(k).innerHTML = '<div class="skeleton"></div>'.repeat(5));
  setTimeout(function () {
    Object.keys(rows).forEach(k => $(k).innerHTML = rows[k].map(productCard).join(""));
    const recent = Store.getRecent().map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
    if (recent.length) { $("recentBox").hidden = false; $("recent").innerHTML = recent.map(productCard).join(""); }
  }, 400);

  $("newsletter").onsubmit = e => { e.preventDefault(); toast("Thanks for subscribing!"); e.target.reset(); };
});


/* ===== Listing page logic (runs only when <body data-page="list">) =====
   Flow: read URL -> build filter sidebar -> filter + sort -> show one page of cards. */
document.addEventListener("DOMContentLoaded", function () {
  if (document.body.dataset.page !== "list") return;
  const $ = id => document.getElementById(id);
  const PER_PAGE = 12;
  const SIZES = ["S","M","L","XL","XXL","UK 5","UK 6","UK 7","UK 8","UK 9","UK 10","UK 11","UK 12"];
  const params = new URLSearchParams(location.search);
  const one = key => params.get(key) ? [params.get(key)] : [];

  // "state" holds everything the shopper has chosen
  const state = {
    category: params.get("category") || "", q: (params.get("q") || "").trim().toLowerCase(),
    deals: params.get("deals") === "1", brands: [], clubs: one("club"), nations: one("nation"),
    min: 0, max: 0, discount: 0, sizes: [], stock: false, page: 1,
    sort: ["best", "new"].includes(params.get("sort")) ? params.get("sort") : "featured"
  };
  $("sort").value = state.sort;

  // ---- Build the filter sidebar ----
  const checks = (name, list, sel) => list.map(v =>
    `<label><input type="checkbox" name="${name}" value="${v}" ${sel.includes(v) ? "checked" : ""}> ${v}</label>`).join("");
  const radios = (name, opts, cur) => opts.map(o =>
    `<label><input type="radio" name="${name}" value="${o[0]}" ${String(cur) === String(o[0]) ? "checked" : ""}> ${o[1]}</label>`).join("");

  function buildFilters() {
    const cats = [["", "All categories"]].concat(CATEGORIES.map(c => [c.slug, c.name]));
    $("filters").innerHTML = `
      <div class="f-head"><h3>Filters</h3><button type="button" class="link-btn" id="clearAll">Clear all</button></div>
      <details open><summary>Category</summary>${radios("category", cats, state.category)}</details>
      <details open><summary>Brand</summary>${checks("brand", BRANDS, state.brands)}</details>
      <details ${state.clubs.length ? "open" : ""}><summary>Club</summary>${checks("club", CLUBS, state.clubs)}</details>
      <details ${state.nations.length ? "open" : ""}><summary>Nation</summary>${checks("nation", NATIONS, state.nations)}</details>
      <details open><summary>Price (₹)</summary>
        <div class="price-row"><input id="minP" type="number" min="0" placeholder="Min" value="${state.min || ""}"> to <input id="maxP" type="number" min="0" placeholder="Max" value="${state.max || ""}"></div></details>
      <details><summary>Discount</summary>${radios("discount", [[0, "Any"], [10, "10% or more"], [25, "25% or more"], [40, "40% or more"], [50, "50% or more"]], state.discount)}</details>
      <details><summary>Size</summary>${checks("size", SIZES, state.sizes)}</details>
      <details open><summary>Availability</summary><label><input type="checkbox" id="stock" ${state.stock ? "checked" : ""}> In stock only</label></details>
      <button type="button" class="btn btn-block drawer-done" id="applyDone">Show results</button>`;
  }

  // Copy what is ticked in the sidebar back into "state"
  function readFilters() {
    const val = name => Array.from(document.querySelectorAll('#filters [name="' + name + '"]:checked')).map(i => i.value);
    state.category = val("category")[0] || "";
    state.brands = val("brand"); state.clubs = val("club"); state.nations = val("nation"); state.sizes = val("size");
    state.min = Number($("minP").value) || 0; state.max = Number($("maxP").value) || 0;
    state.discount = Number(val("discount")[0] || 0);
    state.stock = $("stock").checked; state.page = 1;
  }

  // ---- Filter + sort ----
  const sorters = {
    plow: (a, b) => a.price - b.price, phigh: (a, b) => b.price - a.price,
    new: (a, b) => b.createdAt.localeCompare(a.createdAt),
    discount: (a, b) => b.discountPercent - a.discountPercent,
    best: (a, b) => (b.isBestSeller - a.isBestSeller) || (b.reviewCount - a.reviewCount)
  };
  function getResults() {
    const list = PRODUCTS.filter(p => {
      if (state.category && p.category !== state.category) return false;
      if (state.deals && !p.isDeal) return false;
      if (state.q) {
        const hay = [p.name, p.brand, p.club, p.nation, p.subCategory].join(" ").toLowerCase();
        if (!state.q.split(/\s+/).every(w => hay.includes(w))) return false; // every word must match
      }
      if (state.brands.length && !state.brands.includes(p.brand)) return false;
      if (state.clubs.length && !state.clubs.includes(p.club)) return false;
      if (state.nations.length && !state.nations.includes(p.nation)) return false;
      if (state.min && p.price < state.min) return false;
      if (state.max && p.price > state.max) return false;
      if (p.discountPercent < state.discount) return false;
      if (state.sizes.length && !p.sizes.some(s => state.sizes.includes(s))) return false;
      if (state.stock && p.stock < 1) return false;
      return true;
    });
    if (sorters[state.sort]) list.sort(sorters[state.sort]);
    return list;
  }

  // ---- Draw results + pagination ----
  function render() {
    const list = getResults();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * PER_PAGE;
    const slice = list.slice(start, start + PER_PAGE);
    const cat = CATEGORIES.find(c => c.slug === state.category);
    const title = state.q ? 'Results for "' + params.get("q") + '"' : state.deals ? "Today's Deals" : cat ? cat.name : "All products";
    $("title").textContent = title;
    document.title = title + " - GoalZone";
    $("count").textContent = list.length ? (start + 1) + "-" + (start + slice.length) + " of " + list.length + " results" : "0 results";
    $("grid").innerHTML = slice.length ? slice.map(productCard).join("") :
      `<div class="panel empty"><div class="big"></div><h2>No products found</h2><p>Try fewer filters or a different search.</p><button class="btn" id="emptyClear">Clear all filters</button></div>`;
    let html = "";
    if (pages > 1) {
      html = `<button data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}>‹ Prev</button>`;
      for (let i = 1; i <= pages; i++) html += `<button data-page="${i}" class="${i === state.page ? "active" : ""}">${i}</button>`;
      html += `<button data-page="${state.page + 1}" ${state.page === pages ? "disabled" : ""}>Next ›</button>`;
    }
    $("pager").innerHTML = html;
  }

  function clearAll() {
    Object.assign(state, { category: "", q: "", deals: false, brands: [], clubs: [], nations: [], min: 0, max: 0, discount: 0, sizes: [], stock: false, page: 1 });
    params.delete("q");
    buildFilters(); render();
  }

  // ---- Quick View modal ----
  function quickView(id) {
    const p = PRODUCTS.find(x => x.id === id);
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-label="Quick view">
      <button class="modal-x" aria-label="Close">✕</button>
      <img src="${p.images[0]}" alt="${p.name}">
      <div><h3>${p.name}</h3>
        <div><span class="price">${rupees(p.price)}</span><span class="mrp">M.R.P. ${rupees(p.mrp)}</span></div>
        <p>${p.description}</p>
        ${p.sizes.length ? `<select id="qvSize" aria-label="Size">${p.sizes.map(s => `<option>${s}</option>`).join("")}</select>` : ""}
        <button class="btn" id="qvAdd">Add to Cart</button> <a class="link-btn" href="product.html?id=${p.id}">View full details</a></div></div>`;
    document.body.appendChild(m);
    const close = () => { m.remove(); document.removeEventListener("keydown", esc); };
    const esc = e => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", esc);
    m.onclick = e => { if (e.target === m || e.target.classList.contains("modal-x")) close(); };
    $("qvAdd").onclick = () => {
      const s = $("qvSize");
      Store.addToCart(p.id, s ? s.value : "", 1);
      toast("Added to cart: " + p.name); close();
    };
  }

  // ---- Events ----
  $("filters").addEventListener("change", () => { readFilters(); render(); });
  $("sort").onchange = () => { state.sort = $("sort").value; state.page = 1; render(); };
  const drawer = open => { $("filters").classList.toggle("open", open); $("fOverlay").classList.toggle("open", open); };
  $("openFilters").onclick = () => drawer(true);
  $("fOverlay").onclick = () => drawer(false);
  document.addEventListener("click", function (e) {
    if (e.target.id === "clearAll" || e.target.id === "emptyClear") clearAll();
    if (e.target.id === "applyDone") drawer(false);
    const qv = e.target.closest("[data-qv]");
    if (qv) quickView(Number(qv.dataset.qv));
    const pg = e.target.closest("[data-page]");
    if (pg && !pg.disabled) { state.page = Number(pg.dataset.page); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  // First load: show skeletons for a moment, then real cards
  buildFilters();
  $("grid").innerHTML = '<div class="skeleton"></div>'.repeat(6);
  setTimeout(render, 300);
});


/* ===== Product detail page logic (runs only when <body data-page="detail">) ===== */
document.addEventListener("DOMContentLoaded", function () {
  if (document.body.dataset.page !== "detail") return;
  const $ = id => document.getElementById(id);
  const root = $("detail");
  const id = Number(new URLSearchParams(location.search).get("id"));
  const p = PRODUCTS.find(x => x.id === id);

  // Friendly "not found" state
  if (!p) {
    document.title = "Product not found - GoalZone";
    root.innerHTML = `<div class="panel empty" style="margin-top:1rem"><div class="big"></div><h2>Product not found</h2><p>This product may have been removed.</p><a class="btn" href="products.html">Browse all products</a></div>`;
    return;
  }
  document.title = p.name + " - GoalZone";
  document.querySelector('meta[name="description"]').content = p.description;

  // Escape user-written text before putting it into HTML (stops fake <script> tags)
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let size = "";                                   // chosen size
  const others = PRODUCTS.filter(x => x.id !== p.id);
  const cat = CATEGORIES.find(c => c.slug === p.category);
  const related = others.filter(x => x.category === p.category)
    .concat(others.filter(x => x.category !== p.category && x.brand === p.brand)).slice(0, 10);
  const buddies = others.filter(x => x.category !== p.category && x.isBestSeller && !x.sizes.length).slice(0, 2);
  const recent = Store.getRecent().filter(x => x !== p.id).map(i => PRODUCTS.find(q => q.id === i)).filter(Boolean);
  Store.addRecent(p.id);

  // Delivery date = today + 3 days
  const dd = new Date(); dd.setDate(dd.getDate() + 3);
  const dateText = dd.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  // Rating breakdown (demo maths: spreads the average rating over 5..1 stars)
  const weights = [5, 4, 3, 2, 1].map(s => Math.exp(-1.2 * Math.abs(s - p.rating)));
  const wSum = weights.reduce((a, b) => a + b, 0);
  const bars = [5, 4, 3, 2, 1].map((s, i) => {
    const pct = Math.round(weights[i] / wSum * 100);
    return `<div class="bar-row"><span>${s} star</span><div class="bar"><i style="width:${pct}%"></i></div><span>${pct}%</span></div>`;
  }).join("");

  // "X sold in last N hours" (demo numbers, stable per product)
  const soldCount = 2 + (p.id * 5) % 14, soldHours = 6 + (p.id * 7) % 18;
  const user = Store.getSession();
  const stockHtml = p.stock < 1 ? '<b class="out">Out of stock</b>' : p.stock <= 10 ? `<b class="low">Only ${p.stock} left in stock</b>` : '<b class="in">In stock</b>';
  const rows = [["Brand", p.brand], ["Category", cat ? cat.name : p.category], ["Type", p.subCategory], ["Club", p.club], ["Nation", p.nation], ["Sizes", p.sizes.join(", ")], ["Item ID", "GZ" + String(p.id).padStart(4, "0")]]
    .filter(r => r[1]).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("");

  root.innerHTML = `
  <div class="detail">
    <div class="gallery">
      <div class="thumbs" ${p.images.length > 1 ? "" : "style=\"display:none\""}>${p.images.map((s, i) => `<button class="thumb ${i ? "" : "active"}" data-img="${i}" aria-label="Show image ${i + 1}"><img src="${s}" alt="${p.name} view ${i + 1}" onerror="this.onerror=null;this.src='images/categories/${p.category}.svg'"></button>`).join("")}</div>
      <div class="zoom" id="zoom"><img id="mainImg" src="${p.images[0]}" alt="${p.name}" onerror="this.onerror=null;this.src='images/categories/${p.category}.svg'"></div>
    </div>

    <div class="d-info pd">
      <h1 class="pd-title">${p.name}</h1>
      <div class="pd-sold"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg><span>${soldCount} sold in last ${soldHours} hours</span></div>
      <p class="pd-short">${p.description.length > 110 ? p.description.slice(0, 110).trim() + "…" : p.description}</p>
      <hr class="pd-hr">

      <div class="pd-row"><span class="pd-label">Availability:</span> <span class="pd-avail ${p.stock < 1 ? "out" : "in"}">${p.stock < 1 ? "Out of stock" : "In stock"}</span></div>
      <div class="pd-price"><span class="pd-sale">${rupees(p.price)}</span></div>
      ${p.stock >= 1 && p.stock <= 10 ? `<div class="pd-hurry">Please hurry! Only ${p.stock} left in stock</div><div class="pd-stockbar"><i style="width:${p.stock * 10}%"></i></div>` : ""}

      ${p.sizes.length ? `<div class="pd-opt"><span class="pd-label">SIZE:</span> <span id="sizeLabel"></span>
        <div class="pd-sizes" id="sizeRow">${p.sizes.map((s, i) => `<button type="button" class="pd-size" data-size="${s}">${s}</button>`).join("")}</div></div>` : ""}

      <div class="pd-opt"><span class="pd-label">Quantity:</span>
        <div class="pd-qty">
          <button type="button" id="qtyMinus" aria-label="Decrease quantity">−</button>
          <input id="qty" type="number" value="1" min="1" max="${Math.max(1, Math.min(10, p.stock))}" inputmode="numeric" aria-label="Quantity">
          <button type="button" id="qtyPlus" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="pd-subtotal">Subtotal: <b id="subtotal">${rupees(p.price)}</b></div>

      ${p.sizes.length ? `<button type="button" class="pd-guide" id="sizeChart"><svg viewBox="0 0 24 24" width="24" height="18" aria-hidden="true"><path fill="currentColor" d="M1 7v10h22V7H1zm19 8H3V9h2v3h2V9h2v3h2V9h2v3h2V9h2v3h2V9h2v6z"/></svg> Size guide</button>` : ""}

      <div class="pd-actions">
        <button type="button" class="btn pd-add" id="addCart" ${p.stock < 1 ? "disabled" : ""}>Add to Cart</button>
        <button type="button" class="pd-icon" id="wishBtn" aria-label="Add to wish list"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.6 4.5 6.3 4.5c2 0 3.7 1.1 5.7 3.3 2-2.2 3.7-3.3 5.7-3.3 3.7 0 5.4 3.9 3.9 7.3C19.5 16.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></button>
        <button type="button" class="pd-share" id="shareBtn" aria-label="Share"><svg viewBox="0 0 24 24" width="22" height="22"><g fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></g></svg></button>
      </div>
      <button type="button" class="btn btn-lime pd-buy" id="buyNow" ${p.stock < 1 ? "disabled" : ""}>Buy now</button>

      <h3>About this item</h3>
      <ul>${p.bulletPoints.map(b => `<li>${b}</li>`).join("")}</ul>
      <p>${p.description}</p>
      <table class="spec"><tbody>${rows}</tbody></table>
    </div>
  </div>

  ${buddies.length ? `<section class="panel detail-section"><h2>Frequently bought together</h2>
    <div class="fbt"><div class="fbt-imgs"><img src="${p.images[0]}" alt="">${buddies.map(b => `+ <img src="${b.images[0]}" alt="">`).join("")}</div>
    <div><label><input type="checkbox" checked disabled> <b>This item:</b> ${p.name} - ${rupees(p.price)}</label>
    ${buddies.map(b => `<label><input type="checkbox" class="fbt-c" value="${b.id}" checked> ${b.name} - ${rupees(b.price)}</label>`).join("")}
    <p>Total: <b id="fbtTotal"></b></p><button class="btn" id="fbtAdd">Add selected to cart</button></div></div></section>` : ""}

  <section class="panel detail-section" id="reviews"><h2>Customer reviews</h2>
    <div class="review-grid">
      <div><div class="big-rating">${p.rating} / 5</div><div class="stars">${stars(p.rating)}</div><small>${p.reviewCount.toLocaleString("en-IN")} global ratings</small>${bars}</div>
      <div>
        ${user ? `<form class="rform" id="rform" novalidate><h3>Write a review</h3>
          <select id="rRating" aria-label="Rating"><option value="">Choose rating</option><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Terrible</option></select>
          <input id="rTitle" placeholder="Headline" maxlength="80">
          <textarea id="rText" rows="3" placeholder="What did you like or dislike?"></textarea>
          <p class="error-text" id="rErr"></p><button class="btn" type="submit">Submit review</button></form>`
        : `<p><a class="btn" href="login.html?redirect=${encodeURIComponent("product.html?id=" + p.id)}">Sign in to write a review</a></p>`}
        <div id="reviewList"></div>
      </div>
    </div>
  </section>

  ${related.length ? `<section class="panel detail-section"><h2>Related products</h2><div class="carousel">${related.map(productCard).join("")}</div></section>` : ""}
  ${recent.length ? `<section class="panel detail-section"><h2>Recently viewed</h2><div class="carousel">${recent.map(productCard).join("")}</div></section>` : ""}`;

  // ---- helpers ----
  function renderReviews() {
    const list = Store.getReviews().filter(r => r.productId === p.id).reverse();
    $("reviewList").innerHTML = list.length ? list.map(r => `<div class="review"><b>${esc(r.user)}</b> <span class="stars">${stars(r.rating)}</span>
      <div><b>${esc(r.title)}</b></div><p>${esc(r.text)}</p><small>${new Date(r.date).toLocaleDateString("en-IN")}</small></div>`).join("")
      : "<p>No written reviews yet. Be the first to review this product!</p>";
  }
  function updateWish() { const w = Store.isWished(p.id); $("wishBtn").classList.toggle("on", w); $("wishBtn").setAttribute("aria-label", w ? "Remove from wish list" : "Add to wish list"); }
  function fbtTotal() {
    let t = p.price;
    document.querySelectorAll(".fbt-c:checked").forEach(c => t += PRODUCTS.find(x => x.id === Number(c.value)).price);
    return t;
  }
  // Returns true if the main product was added
  function addMain(qty) {
    if (p.stock < 1) { toast("Out of stock", "error"); return false; }
    if (p.sizes.length && !size) {
      toast("Please select the size", "error");
      const r = $("sizeRow"); r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake");
      return false;
    }
    Store.addToCart(p.id, size, qty);
    return true;
  }
  function showSizeChart() {
    const shoe = p.category === "boots" || p.category === "turf";
    const body = p.sizes.map((s, i) => `<tr><td>${s}</td><td>${shoe ? (24 + (Number(s.slice(3)) - 5) * 0.85).toFixed(1) + " cm" : (92 + i * 6) + " cm"}</td></tr>`).join("");
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-label="Size chart"><button class="modal-x" aria-label="Close">✕</button>
      <div><h3>Size chart</h3><table class="spec"><tbody><tr><td>Size</td><td>${shoe ? "Foot length" : "Chest"}</td></tr>${body}</tbody></table></div></div>`;
    document.body.appendChild(m);
    m.onclick = e => { if (e.target === m || e.target.classList.contains("modal-x")) m.remove(); };
  }

  // Quantity stepper + live subtotal
  function setQty(n) {
    const max = Math.max(1, Math.min(10, p.stock));
    n = Math.min(max, Math.max(1, Math.round(n) || 1));
    $("qty").value = n; $("subtotal").textContent = rupees(p.price * n);
  }
  function shareProduct() {
    const url = location.href;
    if (navigator.share) { navigator.share({ title: p.name, url }).catch(() => {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(() => toast("Link copied")); }
    else toast(url);
  }
  root.addEventListener("change", e => { if (e.target.id === "qty") setQty(Number(e.target.value)); });

  // ---- events ----
  renderReviews(); updateWish();
  if ($("fbtTotal")) $("fbtTotal").textContent = rupees(fbtTotal());

  // Hover zoom on the main image
  const zoom = $("zoom"), mainImg = $("mainImg");
  zoom.onmousemove = e => {
    const r = zoom.getBoundingClientRect();
    mainImg.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%";
    mainImg.style.transform = "scale(2)";
  };
  zoom.onmouseleave = () => { mainImg.style.transform = "scale(1)"; };

  root.addEventListener("click", function (e) {
    const t = e.target;
    const th = t.closest("[data-img]");
    if (th) { mainImg.src = p.images[th.dataset.img]; root.querySelectorAll(".thumb").forEach(b => b.classList.toggle("active", b === th)); }
    const sz = t.closest("[data-size]");
    if (sz) { size = sz.dataset.size; $("sizeLabel").textContent = size; root.querySelectorAll(".pd-size").forEach(b => b.classList.toggle("active", b === sz)); }
    if (t.closest("#qtyMinus")) setQty(Number($("qty").value) - 1);
    if (t.closest("#qtyPlus")) setQty(Number($("qty").value) + 1);
    if (t.closest("#shareBtn")) shareProduct();
    if (t.closest("#sizeChart")) showSizeChart();
    if (t.closest("#addCart") && addMain(Number($("qty").value))) toast("Added to cart: " + p.name);
    if (t.closest("#buyNow") && addMain(Number($("qty").value))) location.href = "checkout.html";
    if (t.closest("#wishBtn")) { Store.toggleWish(p.id); updateWish(); toast(Store.isWished(p.id) ? "Added to wish list" : "Removed from wish list"); }
    if (t.id === "fbtAdd" && addMain(1)) {
      document.querySelectorAll(".fbt-c:checked").forEach(c => Store.addToCart(Number(c.value), "", 1));
      toast("Added selected items to cart");
    }
  });
  root.addEventListener("change", e => { if (e.target.classList.contains("fbt-c")) $("fbtTotal").textContent = rupees(fbtTotal()); });

  // Write-a-review form (only shown to logged-in users)
  root.addEventListener("submit", function (e) {
    if (e.target.id !== "rform") return;
    e.preventDefault();
    const rating = Number($("rRating").value), title = $("rTitle").value.trim(), text = $("rText").value.trim();
    if (!rating) { $("rErr").textContent = "Please choose a star rating."; return; }
    if (!title) { $("rErr").textContent = "Please add a headline."; return; }
    if (text.length < 10) { $("rErr").textContent = "Please write at least 10 characters."; return; }
    Store.saveReviews(Store.getReviews().concat({ productId: p.id, user: Store.getSession().name, rating, title, text, date: new Date().toISOString() }));
    e.target.reset(); $("rErr").textContent = "";
    renderReviews(); toast("Thanks for your review!");
  });
});
