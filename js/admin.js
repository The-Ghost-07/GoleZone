/* ===== Admin / Seller page (demo) =====
   DEMO ONLY: the admin login is checked in the browser, so anyone can read it.
   A real site must check admin rights on a server. */
const ADMIN = { email: "admin@goalzone.com", password: "Admin@123" };
const ADMIN_STATUSES = ["Ordered", "Packed", "Shipped", "Out for delivery", "Delivered"];

document.addEventListener("DOMContentLoaded", function () {
  if (document.body.dataset.page !== "admin") return;
  const $ = id => document.getElementById(id);
  const box = $("adminBox");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let tab = "products", editing = null;          // editing: a product, "new", or null

  /* ---------- login ---------- */
  function drawLogin() {
    box.innerHTML = `<div class="auth-wrap"><div class="auth-card"><h1>Seller login</h1>
      <p><small>Demo login: ${ADMIN.email} / ${ADMIN.password}</small></p>
      <form id="adLogin" novalidate><label for="aEmail">Email</label><input id="aEmail">
      <label for="aPass">Password</label><input id="aPass" type="password">
      <p class="error-text" id="aErr" role="alert"></p><button class="btn btn-block">Sign in</button></form></div></div>`;
    $("adLogin").onsubmit = e => {
      e.preventDefault();
      if ($("aEmail").value.trim().toLowerCase() === ADMIN.email && $("aPass").value === ADMIN.password) { Store.setAdmin(true); drawDash(); }
      else $("aErr").textContent = "Wrong admin email or password.";
    };
  }

  /* ---------- dashboard ---------- */
  function drawDash() {
    box.innerHTML = `<div class="section-head" style="margin-top:1rem"><h1>Seller dashboard</h1><button class="link-btn" id="adOut">Sign out of admin</button></div>
      <div class="tabs"><button class="btn ${tab === "products" ? "" : "btn-outline"}" data-tab="products">Products (${PRODUCTS.length})</button>
      <button class="btn ${tab === "orders" ? "" : "btn-outline"}" data-tab="orders">Orders (${Store.getOrders().length})</button></div>
      <div id="tabBody"></div>`;
    tab === "products" ? drawProducts() : drawOrders();
  }

  /* ---------- products: list + add/edit form ---------- */
  function drawProducts() {
    const rows = PRODUCTS.map(p => `<tr><td>${p.id}</td><td><img src="${p.images[0]}" alt="" onerror="this.onerror=null;this.src='images/categories/${p.category}.svg'"></td><td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${rupees(p.price)}</td><td>${p.stock}</td>
      <td><button class="link-btn" data-edit="${p.id}">Edit</button> <button class="link-btn" data-del="${p.id}">Delete</button></td></tr>`).join("");
    $("tabBody").innerHTML = (editing ? productForm(editing === "new" ? null : editing) : `<button class="btn" id="addNew">+ Add new product</button>`) +
      `<div class="tbl-wrap panel" style="margin-top:1rem"><table class="tbl"><thead><tr><th>ID</th><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function productForm(p) {
    const v = (k, d) => esc(p ? (p[k] === undefined ? d : p[k]) : d);
    const inp = (id, label, val, type) => `<div><label for="${id}">${label}</label><input id="${id}" type="${type || "text"}" value="${val}"></div>`;
    return `<form class="panel rform" id="pForm2" novalidate><h2>${p ? "Edit product #" + p.id : "Add new product"}</h2><div class="aform-grid">
      ${inp("fName", "Product name", v("name", ""))}
      <div><label for="fCat">Category</label><select id="fCat"><option value="">Choose...</option>${CATEGORIES.map(c => `<option value="${c.slug}" ${p && p.category === c.slug ? "selected" : ""}>${c.name}</option>`).join("")}</select></div>
      ${inp("fSub", "Sub-category (e.g. FG, Home Kit)", v("subCategory", ""))}${inp("fBrand", "Brand", v("brand", ""))}
      ${inp("fClub", "Club (jerseys only)", v("club", ""))}${inp("fNation", "Nation (jerseys only)", v("nation", ""))}
      ${inp("fPrice", "Selling price (₹)", v("price", ""), "number")}${inp("fMrp", "M.R.P. (₹)", v("mrp", ""), "number")}${inp("fStock", "Stock", v("stock", 10), "number")}
      ${inp("fImg", "Image URL", p ? esc(p.images[0]) : "")}
      ${inp("fSizes", "Sizes (comma separated, blank if none)", p ? esc(p.sizes.join(", ")) : "")}
      <div class="wide"><label for="fDesc">Description</label><textarea id="fDesc" rows="2">${v("description", "")}</textarea></div>
      <div class="wide"><label for="fBul">Bullet points (one per line)</label><textarea id="fBul" rows="3">${p ? esc(p.bulletPoints.join("\n")) : ""}</textarea></div>
      <label><input type="checkbox" id="fBest" ${p && p.isBestSeller ? "checked" : ""}> Best seller</label><label><input type="checkbox" id="fDeal" ${p && p.isDeal ? "checked" : ""}> Deal of the day</label></div>
      <p class="error-text" id="fErr" role="alert"></p><button class="btn">Save product</button> <button type="button" class="link-btn" id="cancelForm">Cancel</button></form>`;
  }
  function saveProduct() {
    const v = id => $(id).value.trim(), err = t => { $("fErr").textContent = t; return false; };
    const price = Number(v("fPrice")), mrp = Number(v("fMrp")), stock = Number(v("fStock"));
    if (!v("fName")) return err("Product name is required.");
    if (!v("fCat")) return err("Choose a category.");
    if (!(price > 0)) return err("Enter a selling price above 0.");
    if (!(mrp >= price)) return err("M.R.P. must be equal to or more than the selling price.");
    if (!Number.isInteger(stock) || stock < 0) return err("Stock must be a whole number (0 or more).");
    const old = editing === "new" ? null : editing;
    const base = old || { id: Math.max(0, ...PRODUCTS.map(x => x.id), ...Store.get("deletedProducts", [])) + 1, rating: 0, reviewCount: 0, colors: ["Black", "Green", "White"], createdAt: new Date().toISOString() };
    const url = v("fImg");
    const p = Object.assign({}, base, {
      name: v("fName"), category: v("fCat"), subCategory: v("fSub"), brand: v("fBrand"), club: v("fClub"), nation: v("fNation"),
      price, mrp, discountPercent: Math.round((1 - price / mrp) * 100), stock,
      images: old && url === old.images[0] ? old.images : [url || img(v("fName"))],
      description: v("fDesc") || v("fName"), bulletPoints: v("fBul").split("\n").map(s => s.trim()).filter(Boolean),
      sizes: v("fSizes").split(",").map(s => s.trim()).filter(Boolean), isBestSeller: $("fBest").checked, isDeal: $("fDeal").checked
    });
    Store.saveAdminProduct(p);                       // saved for all pages...
    const i = PRODUCTS.findIndex(x => x.id === p.id); // ...and updated right now in memory
    if (i > -1) PRODUCTS[i] = p; else PRODUCTS.push(p);
    editing = null; toast("Product saved"); drawDash();
    return true;
  }

  /* ---------- orders ---------- */
  function drawOrders() {
    const list = Store.getOrders().slice().reverse();
    $("tabBody").innerHTML = list.length ? `<div class="tbl-wrap panel"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>` +
      list.map(o => `<tr><td>${o.id}</td><td>${esc(o.email)}</td><td>${new Date(o.createdAt).toLocaleDateString("en-IN")}</td><td>${o.items.map(i => esc(i.name) + " ×" + i.qty).join("<br>")}</td><td>${rupees(o.total)}</td>
        <td><select data-status="${o.id}" aria-label="Order status"><option value="auto">Auto (simulated)</option>${ADMIN_STATUSES.map(s => `<option ${!o.cancelled && o.status === s ? "selected" : ""}>${s}</option>`).join("")}<option ${o.cancelled ? "selected" : ""}>Cancelled</option></select></td></tr>`).join("") + `</tbody></table></div>`
      : `<div class="panel empty"><div class="big"></div><h2>No orders yet</h2></div>`;
  }

  /* ---------- events ---------- */
  box.addEventListener("click", e => {
    const d = e.target.dataset, id = e.target.id;
    if (d.tab) { tab = d.tab; editing = null; drawDash(); }
    if (id === "adOut") { Store.setAdmin(false); drawLogin(); }
    if (id === "addNew") { editing = "new"; drawProducts(); }
    if (id === "cancelForm") { editing = null; drawProducts(); }
    if (d.edit) { editing = PRODUCTS.find(p => p.id === Number(d.edit)); drawProducts(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    if (d.del && confirm("Delete this product for everyone?")) {
      const i = PRODUCTS.findIndex(p => p.id === Number(d.del));
      PRODUCTS.splice(i, 1); Store.deleteAdminProduct(Number(d.del)); toast("Product deleted"); drawDash();
    }
  });
  box.addEventListener("submit", e => { if (e.target.id === "pForm2") { e.preventDefault(); saveProduct(); } });
  box.addEventListener("change", e => {
    if (!e.target.dataset.status) return;
    const orders = Store.getOrders(), o = orders.find(x => x.id === e.target.dataset.status), val = e.target.value;
    o.cancelled = val === "Cancelled";
    if (val === "auto" || o.cancelled) delete o.status; else o.status = val;   // cart.js orderStage() uses o.status
    Store.saveOrders(orders); toast("Order status updated");
  });

  Store.isAdmin() ? drawDash() : drawLogin();
});
