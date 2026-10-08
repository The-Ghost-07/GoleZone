/* ===== Shared components: header, footer, toast, product card =====
   Every page has <div id="site-header"></div> and <div id="site-footer"></div>;
   this file fills them, so we never copy-paste the header into each page. */

const rupees = n => "₹" + Number(n).toLocaleString("en-IN");

// Small pop-up message: toast("Added to cart") or toast("Oops", "error")
function toast(msg, type) {
  let box = document.getElementById("toasts");
  if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); }
  const t = document.createElement("div");
  t.className = "toast " + (type || "");
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// Star string like ★★★★☆
function stars(r) {
  const full = Math.round(r);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

// One product card (used on home, listing, carousels...)
function productCard(p) {
  return `<article class="pcard">
    <a class="pimg" href="product.html?id=${p.id}"><img src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='images/categories/${p.category}.svg'"></a>
    <div class="pbody">
      <a class="pname" href="product.html?id=${p.id}">${p.name}</a>
      <div><span class="price">${rupees(p.price)}</span></div>
      <button class="btn" data-add="${p.id}">Add to Cart</button>
    </div>
  </article>`;
}

// Handles clicks on any card's heart / Add to Cart button (works on every page)
document.addEventListener("click", function (e) {
  const add = e.target.closest("[data-add]");
  const wish = e.target.closest("[data-wish]");
  if (add) {
    const p = PRODUCTS.find(x => x.id === Number(add.dataset.add));
    // Products with sizes need a size chosen on the detail page
    if (p.sizes.length) { location.href = "product.html?id=" + p.id; return; }
    Store.addToCart(p.id, "", 1);
    toast("Added to cart: " + p.name);
  }
  if (wish) {
    const on = Store.toggleWish(Number(wish.dataset.wish));
    wish.classList.toggle("on", on);
    wish.textContent = on ? "♥" : "♡";
    toast(on ? "Added to wish list" : "Removed from wish list");
  }
});

// ---------- Header ----------
function buildHeader() {
  const user = Store.getSession();
  const pin = Store.getPin();
  const catOptions = CATEGORIES.map(c => `<option value="${c.slug}">${c.name}</option>`).join("");
  const menuLinks = CATEGORIES.map(c => `<a href="products.html?category=${c.slug}">${c.icon} ${c.name}</a>`).join("");
  return `
  <div class="hdr">
    <div class="container hdr-top">
      <button class="burger" id="openMenu" aria-label="Open menu">☰</button>
      <a class="logo" href="index.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/></svg>GOAL<span>ZONE</span></a>
      <button class="deliver" id="pinBtn">Deliver to<b>${pin || "Enter PIN code"}</b></button>
      <form class="search" id="searchForm" role="search" autocomplete="off">
        <select id="searchCat" aria-label="Search category"><option value="">All</option>${catOptions}</select>
        <input id="searchInput" type="search" placeholder="Search jerseys, boots, gloves..." aria-label="Search">
        <button type="submit" aria-label="Search"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></button>
        <div class="suggest" id="suggest"></div>
      </form>
      <div class="hdr-link has-drop" id="accountMenu">
        <button class="hdr-link" id="accountMenuBtn" type="button" aria-haspopup="true" aria-expanded="false">Hello, ${user ? user.name.split(" ")[0] : "Sign in"}<b>Account &amp; Lists ▾</b></button>
        <div class="dropdown">
          ${user ? "" : '<a href="login.html"><b>Sign in</b></a>'}
          <a href="account.html">Your Account</a>
          <a href="orders.html">Your Orders</a>
          <a href="wishlist.html">Wish List</a>
          ${user ? '<a href="#" id="signOut">Sign Out</a>' : ""}
        </div>
      </div>
      <a class="hdr-link orders" href="orders.html">Returns<b>&amp; Orders</b></a>
      <a class="cart-link" href="cart.html" aria-label="Cart"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg><span class="badge-count" id="cartBadge">0</span></a>
    </div>
    <nav class="hdr-nav"><div class="container">
      <button class="all-btn" id="allBtn">☰ All</button>
      <a href="products.html?deals=1">Today's Deals</a>
      <a href="products.html?category=jerseys">Jerseys</a>
      <a href="products.html?category=boots">Boots</a>
      <a href="products.html?category=turf">Turf</a>
      <a href="products.html?category=shin-pads">Shin Pads</a>
      <a href="products.html?category=gloves">Gloves</a>
      <a href="products.html?category=footballs">Footballs</a>
      <a href="products.html?category=bags">Bags</a>
      <a href="products.html?sort=best">Best Sellers</a>
      <a href="products.html?sort=new">New Arrivals</a>
    </div></nav>
  </div>
  <div class="overlay" id="overlay"></div>
  <aside class="side-menu" id="sideMenu" aria-label="All categories">
    <h3>Hello, ${user ? user.name : "Sign in"}</h3>${menuLinks}
  </aside>`;
}

function buildFooter() {
  return `
  <button class="to-top" id="toTop">Back to top</button>
  <footer class="footer">
    <div class="container footer-cols">
      <div><h4>Get to Know Us</h4><a href="#">About GoalZone</a><a href="#">Careers</a><a href="#">Press</a></div>
      <div><h4>Shop</h4><a href="products.html?category=jerseys">Jerseys</a><a href="products.html?category=boots">Boots</a><a href="products.html?category=footballs">Footballs</a></div>
      <div><h4>Help</h4><a href="orders.html">Your Orders</a><a href="#">Returns</a><a href="#">Shipping</a></div>
      <div><h4>Sell</h4><a href="admin.html">Seller / Admin</a></div>
      <div><h4>We accept</h4><p>Card · UPI · Net Banking · Cash on Delivery</p></div>
    </div>
    <div class="footer-bottom">© 2026 GoalZone. Demo project - no real payments.</div>
  </footer>`;
}

function initHeader() {
  const $ = id => document.getElementById(id);
  const badge = () => { $("cartBadge").textContent = Store.cartCount(); };
  badge();
  document.addEventListener("gz:update", badge);

  // Slide-in menu
  const toggleMenu = open => { $("sideMenu").classList.toggle("open", open); $("overlay").classList.toggle("open", open); };
  $("openMenu").onclick = $("allBtn").onclick = () => toggleMenu(true);
  $("overlay").onclick = () => toggleMenu(false);

  // Account dropdown: click/tap toggle + outside-close. Hover still works on desktop.
  const accountMenu = $("accountMenu"), accountBtn = $("accountMenuBtn");
  if (accountMenu && accountBtn) {
    accountBtn.onclick = e => {
      e.stopPropagation();
      const open = accountMenu.classList.toggle("open");
      accountBtn.setAttribute("aria-expanded", String(open));
    };
    document.addEventListener("click", e => {
      if (!e.target.closest("#accountMenu")) {
        accountMenu.classList.remove("open");
        accountBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Change delivery PIN
  $("pinBtn").onclick = () => {
    const v = prompt("Enter your 6-digit PIN code", Store.getPin());
    if (v === null) return;
    if (!/^\d{6}$/.test(v)) return toast("PIN code must be 6 digits", "error");
    Store.setPin(v);
    $("pinBtn").innerHTML = "Deliver to<b>" + v + "</b>";
  };

  // Search + live suggestions
  const input = $("searchInput"), box = $("suggest");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { box.style.display = "none"; return; }
    const hits = PRODUCTS.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6);
    box.innerHTML = hits.map(p => `<a href="product.html?id=${p.id}">${p.name}</a>`).join("") || "<a>No matches</a>";
    box.style.display = "block";
  });
  document.addEventListener("click", e => { if (!e.target.closest("#searchForm")) box.style.display = "none"; });
  $("searchForm").onsubmit = e => {
    e.preventDefault();
    location.href = "products.html?q=" + encodeURIComponent(input.value.trim()) + "&category=" + $("searchCat").value;
  };

  const out = $("signOut");
  if (out) out.onclick = e => { e.preventDefault(); Store.logout(); location.href = "index.html"; };
  $("toTop").onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("site-header").innerHTML = buildHeader();
  document.getElementById("site-footer").innerHTML = buildFooter();
  initHeader();

  // Header gets a shadow once you scroll
  window.addEventListener("scroll", () => document.querySelector(".hdr").classList.toggle("scrolled", window.scrollY > 20), { passive: true });
  // Section heading rule draws in when it scrolls into view
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .5 });
  document.querySelectorAll(".section-head").forEach(h => io.observe(h));
});
