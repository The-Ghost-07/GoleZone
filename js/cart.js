/* ===== Cart, checkout, order-success, orders and wishlist =====
   One file, five pages. Each page has <body data-page="..."> and only its own function runs. */

const COUPONS = { GOAL10: 10 };                  // coupon code -> % off
const FREE_DELIVERY_ABOVE = 999, DELIVERY_FEE = 40;
const STAGES = ["Ordered", "Packed", "Shipped", "Out for delivery", "Delivered"];
const byId = id => PRODUCTS.find(p => p.id === id);
const el = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const keyOf = l => l.id + "|" + l.size;

// Cart entries + their product info
function withProduct(list) {
  return list.map(l => Object.assign({}, l, { p: byId(l.id) })).filter(l => l.p);
}
const cartLines = () => withProduct(Store.getCart());

// All price maths in one place
function calcTotals(lines, code) {
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const discount = Math.round(subtotal * (COUPONS[code] || 0) / 100);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

// Send guests to the login page (login.html comes in Phase 5)
function requireLogin() {
  if (Store.getSession()) return true;
  location.href = "login.html?redirect=" + encodeURIComponent(location.pathname.split("/").pop());
  return false;
}

// Order status is simulated from time passed (demo: a stage every 1-2 minutes).
// If an admin sets order.status (Phase 6), that wins.
function orderStage(o) {
  if (o.status) return STAGES.indexOf(o.status);
  const mins = (Date.now() - new Date(o.createdAt)) / 60000;
  return mins < 1 ? 0 : mins < 2 ? 1 : mins < 4 ? 2 : mins < 6 ? 3 : 4;
}
const deliveryDate = iso => { const d = new Date(iso); d.setDate(d.getDate() + 3); return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }); };

/* ---------------- CART ---------------- */
function initCart() {
  const box = el("cartBox");
  function row(l, actions) {
    return `<div class="cart-row"><img src="${l.p.images[0]}" alt="${esc(l.p.name)}" onerror="this.onerror=null;this.src='images/categories/${l.p.category}.svg'"><div>
      <a href="product.html?id=${l.p.id}"><b>${l.p.name}</b></a>${l.size ? `<div>Size: ${l.size}</div>` : ""}
      <div class="price">${rupees(l.p.price)}</div><div class="cart-actions">${actions}</div></div></div>`;
  }
  function draw() {
    const lines = cartLines(), t = calcTotals(lines, ""), n = lines.reduce((s, l) => s + l.qty, 0);
    const saved = withProduct(Store.get("saved", []));
    const left = lines.length ? `<h1>Shopping Cart</h1>` + lines.map(l => row(l,
      `<div class="stepper" role="group" aria-label="Quantity">
         <button data-step="-1|${keyOf(l)}" aria-label="Decrease quantity" ${l.qty <= 1 ? "disabled" : ""}>−</button>
         <span aria-live="polite">${l.qty}</span>
         <button data-step="1|${keyOf(l)}" aria-label="Increase quantity" ${l.qty >= 10 ? "disabled" : ""}>+</button>
       </div>
       <button class="link-btn" data-del="${keyOf(l)}">Delete</button><button class="link-btn" data-later="${keyOf(l)}">Save for later</button>`)).join("")
      + `<div class="cart-sub">Subtotal (${n} item${n > 1 ? "s" : ""}): <b>${rupees(t.subtotal)}</b></div>`
      : `<div class="empty"><div class="big"></div><h2>Your cart is empty</h2><a class="btn" href="products.html">Start shopping</a></div>`;
    const savedHtml = saved.length ? `<section class="panel" style="margin-top:1rem"><h2>Saved for later (${saved.length})</h2>` + saved.map(l => row(l,
      `<button class="link-btn" data-back="${keyOf(l)}">Move to cart</button><button class="link-btn" data-sdel="${keyOf(l)}">Delete</button>`)).join("") + `</section>` : "";
    const side = lines.length ? `<aside class="panel"><p>${t.subtotal >= FREE_DELIVERY_ABOVE ? "Your order qualifies for <b>FREE delivery</b>" : "Add " + rupees(FREE_DELIVERY_ABOVE - t.subtotal) + " more for FREE delivery"}</p>
      <p>Subtotal (${n} items): <b>${rupees(t.subtotal)}</b></p><a class="btn btn-lime btn-block" href="checkout.html">Proceed to Buy</a></aside>` : "";
    box.innerHTML = `<div class="cart-grid"><div><section class="panel">${left}</section>${savedHtml}</div>${side}</div>`;
  }
  const notKey = k => l => keyOf(l) !== k;
  box.addEventListener("click", e => {
    const t = e.target.closest("button, a") || e.target;
    const get = a => t.dataset ? t.dataset[a] : undefined;
    if (get("del")) Store.saveCart(Store.getCart().filter(notKey(get("del"))));
    if (get("later")) {
      const l = Store.getCart().find(x => keyOf(x) === get("later"));
      Store.set("saved", Store.get("saved", []).concat(l)); Store.saveCart(Store.getCart().filter(notKey(get("later"))));
    }
    if (get("back")) {
      const l = Store.get("saved", []).find(x => keyOf(x) === get("back"));
      Store.addToCart(l.id, l.size, l.qty); Store.set("saved", Store.get("saved", []).filter(notKey(get("back"))));
    }
    if (get("sdel")) Store.set("saved", Store.get("saved", []).filter(notKey(get("sdel"))));
    if (get("step")) {
      const [deltaText, key] = get("step").split("|");
      const delta = Number(deltaText);
      const c = Store.getCart();
      const line = c.find(l => keyOf(l) === key);
      if (line && Number.isFinite(delta)) {
        line.qty = Math.max(1, Math.min(10, Number(line.qty) + delta));
        Store.saveCart(c);
      }
    }
    draw();
  });
  draw();
}

/* ---------------- CHECKOUT (Address -> Payment -> Review) ---------------- */
function initCheckout() {
  if (!requireLogin()) return;
  if (!cartLines().length) { location.href = "cart.html"; return; }
  const user = Store.getSession(), addrKey = "addresses_" + user.email;
  const addrs = () => Store.get(addrKey, []);
  const st = { step: 1, addr: addrs().length ? addrs()[0].id : null, pay: "", newAddr: false };
  const field = (id, label, extra) => `<input id="${id}" placeholder="${label}" aria-label="${label}" ${extra || ""}>`;

  function drawSummary() {
    const code = Store.get("coupon", ""), t = calcTotals(cartLines(), code);
    el("summary").innerHTML = `<h3>Order summary</h3>
      <div class="sum-row"><span>Items</span><span>${rupees(t.subtotal)}</span></div>
      ${t.discount ? `<div class="sum-row"><span>Coupon ${code}</span><span>-${rupees(t.discount)}</span></div>` : ""}
      <div class="sum-row"><span>Delivery</span><span>${t.delivery ? rupees(t.delivery) : "FREE"}</span></div>
      <div class="sum-row total"><span>Order total</span><span>${rupees(t.total)}</span></div>
      <div class="coupon"><input id="cpn" placeholder="Coupon (try GOAL10)" aria-label="Coupon code"><button class="btn" id="cpnBtn">Apply</button></div><p class="error-text" id="cpnMsg"></p>`;
  }

  function drawSteps() {
    const bar = `<ol class="steps">${["Address", "Payment", "Review"].map((n, i) => `<li class="${i + 1 < st.step ? "done" : i + 1 === st.step ? "active" : ""}">${i + 1}. ${n}</li>`).join("")}</ol>`;
    let body = "";
    if (st.step === 1) {
      const list = addrs();
      body = `<h2>Delivery address</h2>` + list.map(a => `<label class="addr"><input type="radio" name="addr" value="${a.id}" ${st.addr === a.id ? "checked" : ""}>
        <span><b>${esc(a.name)}</b>, ${esc(a.line)}, ${esc(a.city)}, ${esc(a.state)} - ${a.pin}<br>Phone: ${a.phone}</span></label>`).join("")
        + (list.length ? `<button class="btn" id="useAddr">Deliver to this address</button> <button class="link-btn" id="newAddr">+ Add a new address</button>` : "")
        + `<form id="aform" class="rform" novalidate ${list.length && !st.newAddr ? "hidden" : ""}><h3>New address</h3>
          ${field("aName", "Full name")}${field("aPhone", "10-digit mobile number", 'maxlength="10" inputmode="numeric"')}${field("aPin", "6-digit PIN code", 'maxlength="6" inputmode="numeric"')}
          ${field("aLine", "House no., street, area")}${field("aCity", "City")}${field("aState", "State")}
          <p class="error-text" id="aErr"></p><button class="btn">Save and continue</button></form>`;
    } else if (st.step === 2) {
      body = `<h2>Payment method</h2>
        ${[["cod", "Cash on Delivery"], ["upi", "UPI"], ["card", "Credit / Debit Card"], ["netbanking", "Net Banking"]].map((m, i) => `<label class="addr"><input type="radio" name="pay" value="${m[0]}" ${i === 0 ? "checked" : ""}> ${m[1]}</label>`).join("")}
        <div class="rform" id="pf-upi" hidden>${field("upiId", "UPI ID (name@bank)")}</div>
        <div class="rform" id="pf-card" hidden>${field("cardNo", "16-digit card number", 'maxlength="19" inputmode="numeric"')}${field("cardName", "Name on card")}${field("cardExp", "Expiry MM/YY", 'maxlength="5"')}${field("cardCvv", "CVV", 'maxlength="3" inputmode="numeric" type="password"')}</div>
        <div class="rform" id="pf-netbanking" hidden><select id="bank" aria-label="Bank"><option value="">Choose your bank</option><option>SBI</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option></select></div>
        <p class="error-text" id="pErr"></p><button class="btn" id="payNext">Continue</button> <button class="link-btn" id="backAddr">‹ Back</button>
        <p><small>Demo only: no real payment happens and card details are never saved.</small></p>`;
    } else {
      const a = addrs().find(x => x.id === st.addr);
      body = `<h2>Review your order</h2><p><b>Deliver to:</b> ${esc(a.name)}, ${esc(a.line)}, ${esc(a.city)} - ${a.pin} <button class="link-btn" id="backAddr">Change</button></p>
        <p><b>Payment:</b> ${esc(st.pay)} <button class="link-btn" id="backPay">Change</button></p>
        ${cartLines().map(l => `<div class="cart-row"><img src="${l.p.images[0]}" alt=""><div>${l.p.name}${l.size ? " (" + l.size + ")" : ""}<br>Qty ${l.qty} · <b>${rupees(l.p.price * l.qty)}</b></div></div>`).join("")}
        <button class="btn btn-lime btn-block" id="placeOrder">Place your order</button>`;
    }
    el("steps").innerHTML = `<div class="panel">${bar}${body}</div>`;
    showPay();
  }
  function showPay() {
    const m = document.querySelector('[name="pay"]:checked');
    ["upi", "card", "netbanking"].forEach(x => { const f = el("pf-" + x); if (f) f.hidden = !m || m.value !== x; });
  }

  function saveAddress() {
    const v = id => el(id).value.trim(), err = m => { el("aErr").textContent = m; return false; };
    if (v("aName").length < 2) return err("Enter your full name.");
    if (!/^\d{10}$/.test(v("aPhone"))) return err("Mobile number must be exactly 10 digits.");
    if (!/^\d{6}$/.test(v("aPin"))) return err("PIN code must be exactly 6 digits.");
    if (!v("aLine") || !v("aCity") || !v("aState")) return err("Please fill in the full address.");
    const a = { id: Date.now(), name: v("aName"), phone: v("aPhone"), pin: v("aPin"), line: v("aLine"), city: v("aCity"), state: v("aState") };
    Store.set(addrKey, addrs().concat(a)); st.addr = a.id; return true;
  }
  function checkPayment() {
    const m = document.querySelector('[name="pay"]:checked').value, v = id => el(id).value.trim(), err = t => { el("pErr").textContent = t; return false; };
    if (m === "cod") st.pay = "Cash on Delivery";
    if (m === "upi") { if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(v("upiId"))) return err("Enter a valid UPI ID like name@bank."); st.pay = "UPI (" + v("upiId") + ")"; }
    if (m === "card") {
      const no = v("cardNo").replace(/\s/g, "");
      if (!/^\d{16}$/.test(no)) return err("Card number must be 16 digits.");
      if (v("cardName").length < 2) return err("Enter the name on the card.");
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(v("cardExp"))) return err("Expiry must look like 08/28.");
      if (!/^\d{3}$/.test(v("cardCvv"))) return err("CVV must be 3 digits.");
      st.pay = "Card ending " + no.slice(-4);           // never store the full number
    }
    if (m === "netbanking") { if (!v("bank")) return err("Choose your bank."); st.pay = "Net Banking (" + v("bank") + ")"; }
    return true;
  }
  function placeOrder() {
    const lines = cartLines(), code = Store.get("coupon", ""), t = calcTotals(lines, code);
    const order = {
      id: "GZ" + Date.now().toString().slice(-8), email: user.email, createdAt: new Date().toISOString(),
      items: lines.map(l => ({ id: l.id, name: l.p.name, image: l.p.images[0], price: l.p.price, size: l.size, qty: l.qty })),
      address: addrs().find(a => a.id === st.addr), payment: st.pay, coupon: t.discount ? code : "",
      subtotal: t.subtotal, discount: t.discount, delivery: t.delivery, total: t.total, cancelled: false
    };
    Store.saveOrders(Store.getOrders().concat(order));
    Store.saveCart([]); Store.set("coupon", ""); Store.set("lastOrder", order.id);
    location.href = "order-success.html";
  }

  document.addEventListener("click", e => {
    const id = e.target.id;
    if (id === "cpnBtn") {
      const c = el("cpn").value.trim().toUpperCase();
      if (COUPONS[c]) { Store.set("coupon", c); toast("Coupon " + c + " applied"); drawSummary(); }
      else el("cpnMsg").textContent = "Invalid coupon code.";
    }
    if (id === "newAddr") { st.newAddr = true; el("aform").hidden = false; }
    if (id === "useAddr") { const r = document.querySelector('[name="addr"]:checked'); st.addr = Number(r.value); st.step = 2; drawSteps(); }
    if (id === "payNext" && checkPayment()) { st.step = 3; drawSteps(); }
    if (id === "backAddr") { st.step = 1; drawSteps(); }
    if (id === "backPay") { st.step = 2; drawSteps(); }
    if (id === "placeOrder") placeOrder();
  });
  document.addEventListener("change", e => { if (e.target.name === "pay") showPay(); });
  document.addEventListener("submit", e => { if (e.target.id === "aform") { e.preventDefault(); if (saveAddress()) { st.step = 2; drawSteps(); } } });
  drawSteps(); drawSummary();
}

/* ---------------- ORDER SUCCESS ---------------- */
function initSuccess() {
  const o = Store.getOrders().find(x => x.id === Store.get("lastOrder", ""));
  if (!o) { location.href = "index.html"; return; }
  el("doneBox").innerHTML = `<div class="big"></div><h1>Order placed!</h1><p>Thank you, ${esc(Store.getSession() ? Store.getSession().name : "")}.</p>
    <p>Order ID: <b>${o.id}</b></p><p>Arriving by <b>${deliveryDate(o.createdAt)}</b></p><p>Total paid: <b>${rupees(o.total)}</b> (${esc(o.payment)})</p>
    <a class="btn" href="orders.html">View your orders</a> <a class="btn btn-outline" href="index.html">Continue shopping</a>
    <p><button class="link-btn" id="cancelNow">Changed your mind? Cancel this order</button></p>`;
  $("cancelNow").onclick = () => {
    if (!confirm("Cancel this order?")) return;
    const orders = Store.getOrders(); orders.find(x => x.id === o.id).cancelled = true; Store.saveOrders(orders);
    toast("Order cancelled"); location.href = "orders.html";
  };
  const colors = ["#c6ff3d", "#1faa59", "#f5a623", "#d8352a", "#fff"];   // confetti
  for (let i = 0; i < 70; i++) {
    const c = document.createElement("i");
    c.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % 5]};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random()}s`;
    el("confetti").appendChild(c);
  }
  setTimeout(() => { el("confetti").innerHTML = ""; }, 6000);
}

/* ---------------- ORDERS ---------------- */
function initOrders() {
  if (!requireLogin()) return;
  const me = Store.getSession().email;
  function draw() {
    const list = Store.getOrders().filter(o => o.email === me).reverse();
    el("ordersBox").innerHTML = list.length ? list.map(o => {
      const s = orderStage(o);
      const track = o.cancelled ? `<p class="out"><b>Cancelled</b></p>` : `<ol class="track">${STAGES.map((n, i) => `<li class="${i < s ? "done" : i === s ? "done active" : ""}">${n}</li>`).join("")}</ol>`;
      return `<section class="panel order"><div class="order-head"><span>Placed: ${new Date(o.createdAt).toLocaleDateString("en-IN")}</span><span>Total: <b>${rupees(o.total)}</b></span><span>Order # ${o.id}</span></div>${track}
        ${o.items.map((it, i) => `<div class="cart-row"><img src="${it.image}" alt=""><div><a href="product.html?id=${it.id}">${it.name}</a>${it.size ? `<div>Size: ${it.size}</div>` : ""}<div>Qty ${it.qty} · ${rupees(it.price)}</div>
          <button class="btn" data-again="${o.id}|${i}">Buy it again</button></div></div>`).join("")}
        <button class="btn btn-outline" data-invoice="${o.id}">Invoice</button> ${!o.cancelled && s < 2 ? `<button class="btn btn-outline" data-cancel="${o.id}">Cancel order</button>` : ""}</section>`;
    }).join("") : `<div class="panel empty"><div class="big"></div><h2>No orders yet</h2><a class="btn" href="products.html">Start shopping</a></div>`;
  }
  el("ordersBox").addEventListener("click", e => {
    const d = e.target.dataset, orders = Store.getOrders();
    if (d.cancel && confirm("Cancel this order?")) { orders.find(o => o.id === d.cancel).cancelled = true; Store.saveOrders(orders); draw(); toast("Order cancelled"); }
    if (d.again) { const [oid, i] = d.again.split("|"), it = orders.find(o => o.id === oid).items[i]; Store.addToCart(it.id, it.size, 1); toast("Added to cart"); }
    if (d.invoice) printInvoice(orders.find(o => o.id === d.invoice));
  });
  draw(); setInterval(draw, 15000);      // refresh the tracker as time passes
}
function printInvoice(o) {
  const w = window.open("", "_blank");
  if (!w) return toast("Allow pop-ups to print the invoice", "error");
  w.document.write(`<title>Invoice ${o.id}</title><body style="font-family:Arial;padding:20px"><h1>GoalZone Invoice</h1><p>Order # ${o.id}<br>Date: ${new Date(o.createdAt).toLocaleDateString("en-IN")}<br>Ship to: ${esc(o.address.name)}, ${esc(o.address.line)}, ${esc(o.address.city)} - ${o.address.pin}<br>Payment: ${esc(o.payment)}</p>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
    ${o.items.map(i => `<tr><td>${esc(i.name)} ${i.size}</td><td>${i.qty}</td><td>${rupees(i.price)}</td><td>${rupees(i.price * i.qty)}</td></tr>`).join("")}</table>
    <p>Subtotal: ${rupees(o.subtotal)}<br>Discount: -${rupees(o.discount)}<br>Delivery: ${o.delivery ? rupees(o.delivery) : "FREE"}<br><b>Total: ${rupees(o.total)}</b></p></body>`);
  w.document.close(); w.print();
}

/* ---------------- WISHLIST ---------------- */
function initWishlist() {
  function draw() {
    const items = Store.getWishlist().map(byId).filter(Boolean);
    el("wishBox").innerHTML = items.length ? items.map(p => `<article class="pcard"><a class="pimg" href="product.html?id=${p.id}"><img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='images/categories/${p.category}.svg'"></a>
      <div class="pbody"><a class="pname" href="product.html?id=${p.id}">${p.name}</a><div><span class="price">${rupees(p.price)}</span><span class="mrp">${rupees(p.mrp)}</span></div>
      <button class="btn" data-move="${p.id}">Move to cart</button><button class="link-btn" data-rm="${p.id}">Remove</button></div></article>`).join("")
      : `<div class="panel empty"><div class="big">♡</div><h2>Your wish list is empty</h2><a class="btn" href="products.html">Browse products</a></div>`;
  }
  el("wishBox").addEventListener("click", e => {
    const d = e.target.dataset;
    if (d.rm) { Store.toggleWish(Number(d.rm)); draw(); }
    if (d.move) {
      const p = byId(Number(d.move));
      if (p.sizes.length) { location.href = "product.html?id=" + p.id; return; }   // needs a size first
      Store.addToCart(p.id, "", 1); Store.toggleWish(p.id); draw(); toast("Moved to cart");
    }
  });
  draw();
}

// Run the right function for this page
document.addEventListener("DOMContentLoaded", function () {
  const pages = { cart: initCart, checkout: initCheckout, success: initSuccess, orders: initOrders, wishlist: initWishlist };
  const run = pages[document.body.dataset.page];
  if (run) run();
});
