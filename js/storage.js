/* ===== GoalZone storage layer =====
   ALL localStorage access lives in this file. Later, to use a real backend,
   you only rewrite the functions inside Store - the pages keep calling the same names.
   NOTE: real security (passwords, sessions, payments) needs a backend. */

const Store = {
  PREFIX: "goalzone_",

  // --- basic helpers ---
  get(key, fallback) {
    try {
      const v = localStorage.getItem(this.PREFIX + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(this.PREFIX + key, JSON.stringify(value)); } catch (e) {}
    document.dispatchEvent(new Event("gz:update")); // header badges listen for this
  },

  // Very simple hash (demo only - NOT secure)
  hash(text) {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
    return "h" + h;
  },

  // --- delivery PIN ---
  getPin() { return this.get("pin", ""); },
  setPin(pin) { this.set("pin", pin); },

  // --- users / session (used from Phase 5) ---
  getUsers() { return this.get("users", []); },
  saveUsers(list) { this.set("users", list); },
  // Session = { name, email } (email holds the email OR mobile used to sign up) or null.
  // "Keep me signed in" -> localStorage (stays); otherwise sessionStorage (ends when the browser closes).
  getSession() {
    try {
      const k = this.PREFIX + "session";
      const v = sessionStorage.getItem(k) || localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  },
  setSession(user, remember) {
    try {
      const k = this.PREFIX + "session";
      localStorage.removeItem(k); sessionStorage.removeItem(k);
      (remember === false ? sessionStorage : localStorage).setItem(k, JSON.stringify(user));
    } catch (e) {}
    document.dispatchEvent(new Event("gz:update"));
  },
  // Log in: keep the guest cart and merge the user's earlier saved cart into it
  login(user, remember) {
    this.setSession(user, remember);
    const mine = this.get("cart_" + user.email, []);
    mine.forEach(l => this.addToCart(l.id, l.size, l.qty));
    this.set("cart_" + user.email, []);
  },
  // Log out: save this user's cart for next time, then empty the visible cart
  logout() {
    const u = this.getSession();
    if (u) this.set("cart_" + u.email, this.getCart());
    this.setSession(null);
    this.set("cart", []);
  },

  // --- cart: [{ id, size, qty }] ---
  getCart() { return this.get("cart", []); },
  saveCart(cart) { this.set("cart", cart); },
  addToCart(id, size, qty) {
    const cart = this.getCart();
    const line = cart.find(l => l.id === id && l.size === (size || ""));
    if (line) line.qty += qty || 1; else cart.push({ id, size: size || "", qty: qty || 1 });
    this.saveCart(cart);
  },
  cartCount() { return this.getCart().reduce((n, l) => n + l.qty, 0); },

  // --- wishlist: [id, id, ...] ---
  getWishlist() { return this.get("wishlist", []); },
  isWished(id) { return this.getWishlist().includes(id); },
  toggleWish(id) {
    let w = this.getWishlist();
    w = w.includes(id) ? w.filter(x => x !== id) : w.concat(id);
    this.set("wishlist", w);
    return w.includes(id);
  },

  // --- orders and reviews (used from Phase 3/4) ---
  getOrders() { return this.get("orders", []); },
  saveOrders(list) { this.set("orders", list); },
  getReviews() { return this.get("reviews", []); },
  saveReviews(list) { this.set("reviews", list); },

  // --- recently viewed (latest first, max 12) ---
  getRecent() { return this.get("recent", []); },
  addRecent(id) { this.set("recent", [id].concat(this.getRecent().filter(x => x !== id)).slice(0, 12)); },

  // --- admin (demo) ---
  isAdmin() { try { return sessionStorage.getItem(this.PREFIX + "admin") === "1"; } catch (e) { return false; } },
  setAdmin(on) {
    try { on ? sessionStorage.setItem(this.PREFIX + "admin", "1") : sessionStorage.removeItem(this.PREFIX + "admin"); } catch (e) {}
  },
  // Products added/edited by the admin, and ids the admin deleted, are kept here and
  // applied on top of products.js on every page (see the bottom of this file).
  saveAdminProduct(p) { this.set("adminProducts", this.get("adminProducts", []).filter(x => x.id !== p.id).concat(p)); },
  deleteAdminProduct(id) {
    this.set("adminProducts", this.get("adminProducts", []).filter(x => x.id !== id));
    this.set("deletedProducts", this.get("deletedProducts", []).concat(id));
  }
};

// Runs once per page load: merge the admin's changes into the PRODUCTS array from products.js
(function applyAdminChanges() {
  Store.get("adminProducts", []).forEach(function (e) {
    const i = PRODUCTS.findIndex(p => p.id === e.id);
    if (i > -1) PRODUCTS[i] = e; else PRODUCTS.push(e);
  });
  const gone = Store.get("deletedProducts", []);
  for (let i = PRODUCTS.length - 1; i >= 0; i--) if (gone.includes(PRODUCTS[i].id)) PRODUCTS.splice(i, 1);
})();
