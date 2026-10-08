/* ===== Login, Sign-up and Account pages =====
   SECURITY NOTE: everything here runs in the browser, so anyone can open DevTools and
   read the users list. Real security (password hashing, sessions, tokens) needs a backend.
   The "hash" below only stops passwords being stored as readable text. */

document.addEventListener("DOMContentLoaded", function () {
  const page = document.body.dataset.page;
  if (!["login", "signup", "account"].includes(page)) return;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---- shared helpers ----
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, MOBILE = /^\d{10}$/;
  const normId = v => v.trim().toLowerCase();                 // email is stored in lowercase
  const passIssue = p => p.length < 8 ? "Use at least 8 characters." : (!/[A-Za-z]/.test(p) || !/\d/.test(p)) ? "Use both letters and numbers." : "";
  const findUser = id => Store.getUsers().find(u => u.id === id);

  // Only allow redirects to our own pages (stops "open redirect" tricks)
  function target() {
    const r = new URLSearchParams(location.search).get("redirect") || "";
    return /^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(r) ? r : "index.html";
  }

  // Show / hide password buttons
  document.addEventListener("click", e => {
    const t = e.target.dataset.toggle;
    if (!t) return;
    const inp = $(t), show = inp.type === "password";
    inp.type = show ? "text" : "password";
    e.target.textContent = show ? "Hide" : "Show";
  });

  /* ---------------- LOGIN ---------------- */
  if (page === "login") {
    const msg = t => { $("lErr").textContent = t; };
    $("toSignup").href = "signup.html" + location.search;
    $("loginForm").addEventListener("submit", e => {
      e.preventDefault();
      const id = normId($("lId").value), pass = $("lPass").value;
      if (!id || !pass) return msg("Enter your email or mobile number and your password.");
      const u = findUser(id);
      if (!u) return msg("No account found with this email or mobile. Create one first.");
      if (u.pass !== Store.hash(pass)) return msg("Incorrect password. Try again or use Forgot password.");
      Store.login({ name: u.name, email: u.id }, $("lKeep").checked);   // merges guest cart too
      toast("Welcome back, " + u.name.split(" ")[0] + "!");
      setTimeout(() => { location.href = target(); }, 500);
    });

    // Forgot password (demo): there is no email server, so the code is shown on screen
    let resetId = "", resetCode = "";
    const rErr = t => { $("rErr").textContent = t; };
    $("forgotBtn").onclick = () => { $("loginForm").hidden = true; $("forgotBtn").hidden = true; $("resetBox").hidden = false; };
    $("sendCode").onclick = () => {
      const u = findUser(normId($("rId").value));
      if (!u) return rErr("No account found with this email or mobile.");
      resetId = u.id; resetCode = String(Math.floor(100000 + Math.random() * 900000));
      rErr(""); $("rStep1").hidden = true; $("rStep2").hidden = false;
      $("codeNote").textContent = "Demo mode: your reset code is " + resetCode + ". A real site would email or SMS it.";
    };
    $("doReset").onclick = () => {
      const np = $("rNew").value;
      if ($("rCode").value.trim() !== resetCode) return rErr("That code is not correct.");
      if (passIssue(np)) return rErr(passIssue(np));
      if (np !== $("rNew2").value) return rErr("The two passwords do not match.");
      const users = Store.getUsers();
      users.find(u => u.id === resetId).pass = Store.hash(np);
      Store.saveUsers(users);
      toast("Password changed. Please sign in.");
      $("resetBox").hidden = true; $("loginForm").hidden = false; $("forgotBtn").hidden = false; $("lId").value = resetId;
    };
  }

  /* ---------------- SIGN-UP (live validation) ---------------- */
  if (page === "signup") {
    function strength(p) {
      let s = 0;
      if (p.length >= 8) s++;
      if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
      if (/\d/.test(p)) s++;
      if (/[^A-Za-z0-9]/.test(p)) s++;
      return s;
    }
    // Each validator returns an error message, or "" when the field is fine
    const rules = {
      sName: () => $("sName").value.trim().length < 2 ? "Enter your full name." : "",
      sId: () => {
        const v = normId($("sId").value);
        if (!EMAIL.test(v) && !MOBILE.test(v)) return "Enter a valid email or a 10-digit mobile number.";
        return findUser(v) ? "An account with this email/mobile already exists. Try signing in." : "";
      },
      sPass: () => passIssue($("sPass").value),
      sConfirm: () => $("sConfirm").value !== $("sPass").value ? "Passwords do not match." : "",
      sTerms: () => $("sTerms").checked ? "" : "Please accept the terms to continue."
    };
    function validate(id) {
      const m = rules[id]();
      $("e-" + id).textContent = m;
      $(id).classList.toggle("bad", !!m);
      return m;
    }
    Object.keys(rules).forEach(id => {
      $(id).addEventListener("input", () => { validate(id); if (id === "sPass" && $("sConfirm").value) validate("sConfirm"); });
      $(id).addEventListener("blur", () => validate(id));
    });
    $("sPass").addEventListener("input", () => {           // strength meter
      const s = strength($("sPass").value), names = ["Too weak", "Weak", "Fair", "Good", "Strong"];
      $("meterBar").style.width = (s * 25) + "%";
      $("meterBar").style.background = ["#d8352a", "#d8352a", "#f5a623", "#1faa59", "#148244"][s];
      $("meterText").textContent = $("sPass").value ? "Strength: " + names[s] : "";
    });
    $("signupForm").addEventListener("submit", e => {
      e.preventDefault();
      const errors = Object.keys(rules).map(validate).filter(Boolean);
      if (errors.length) return;
      const id = normId($("sId").value);
      Store.saveUsers(Store.getUsers().concat({ id, name: $("sName").value.trim(), pass: Store.hash($("sPass").value) }));
      Store.login({ name: $("sName").value.trim(), email: id }, true);
      toast("Account created. Welcome to GoalZone!");
      setTimeout(() => { location.href = target(); }, 600);
    });
  }

  /* ---------------- ACCOUNT (protected page) ---------------- */
  if (page === "account") {
    const me = Store.getSession();
    if (!me) { location.href = "login.html?redirect=account.html"; return; }
    const addrKey = "addresses_" + me.email;          // same key the checkout page uses
    const input = (id, ph, extra) => `<input id="${id}" placeholder="${ph}" aria-label="${ph}" ${extra || ""}>`;

    $("acctBox").innerHTML = `
      <section class="panel"><h2>Profile</h2><form class="rform" id="pForm">
        <label for="pName">Name</label>${input("pName", "Full name", 'value="' + esc(me.name) + '"')}
        <label>Email / mobile</label><input value="${esc(me.email)}" disabled>
        <p class="error-text" id="pMsg"></p><button class="btn">Save profile</button></form></section>
      <section class="panel"><h2>Saved addresses</h2><div id="addrList"></div>
        <form class="rform" id="adForm"><h3>Add a new address</h3>
          ${input("adName", "Full name")}${input("adPhone", "10-digit mobile number", 'maxlength="10" inputmode="numeric"')}${input("adPin", "6-digit PIN code", 'maxlength="6" inputmode="numeric"')}
          ${input("adLine", "House no., street, area")}${input("adCity", "City")}${input("adState", "State")}
          <p class="error-text" id="adMsg"></p><button class="btn">Save address</button></form></section>
      <section class="panel"><h2>Change password</h2><form class="rform" id="cpForm">
        <div class="pw">${input("cpOld", "Current password", 'type="password"')}<button type="button" class="pw-toggle" data-toggle="cpOld">Show</button></div>
        <div class="pw">${input("cpNew", "New password (8+ characters, letters and numbers)", 'type="password"')}<button type="button" class="pw-toggle" data-toggle="cpNew">Show</button></div>
        ${input("cpNew2", "Confirm new password", 'type="password"')}
        <p class="error-text" id="cpMsg"></p><button class="btn">Change password</button></form></section>`;

    function drawAddrs() {
      const list = Store.get(addrKey, []);
      $("addrList").innerHTML = list.length ? list.map((a, i) => `<div class="addr"><span><b>${esc(a.name)}</b>, ${esc(a.line)}, ${esc(a.city)}, ${esc(a.state)} - ${a.pin}<br>Phone: ${a.phone}</span>
        <button class="link-btn" data-del="${i}">Delete</button></div>`).join("") : "<p>No saved addresses yet.</p>";
    }
    drawAddrs();
    $("addrList").onclick = e => {
      if (e.target.dataset.del === undefined) return;
      Store.set(addrKey, Store.get(addrKey, []).filter((_, i) => i !== Number(e.target.dataset.del)));
      drawAddrs();
    };

    $("pForm").onsubmit = e => {
      e.preventDefault();
      const name = $("pName").value.trim();
      if (name.length < 2) { $("pMsg").textContent = "Enter your full name."; return; }
      const users = Store.getUsers(), u = users.find(x => x.id === me.email);
      if (u) { u.name = name; Store.saveUsers(users); }
      Store.setSession({ name, email: me.email }, !!localStorage.getItem(Store.PREFIX + "session"));
      $("pMsg").textContent = ""; toast("Profile saved");
    };

    $("adForm").onsubmit = e => {
      e.preventDefault();
      const v = id => $(id).value.trim(), err = t => { $("adMsg").textContent = t; };
      if (v("adName").length < 2) return err("Enter your full name.");
      if (!/^\d{10}$/.test(v("adPhone"))) return err("Mobile number must be exactly 10 digits.");
      if (!/^\d{6}$/.test(v("adPin"))) return err("PIN code must be exactly 6 digits.");
      if (!v("adLine") || !v("adCity") || !v("adState")) return err("Please fill in the full address.");
      Store.set(addrKey, Store.get(addrKey, []).concat({ id: Date.now(), name: v("adName"), phone: v("adPhone"), pin: v("adPin"), line: v("adLine"), city: v("adCity"), state: v("adState") }));
      e.target.reset(); err(""); drawAddrs(); toast("Address saved");
    };

    $("cpForm").onsubmit = e => {
      e.preventDefault();
      const err = t => { $("cpMsg").textContent = t; };
      const users = Store.getUsers(), u = users.find(x => x.id === me.email);
      if (!u || u.pass !== Store.hash($("cpOld").value)) return err("Current password is not correct.");
      if (passIssue($("cpNew").value)) return err(passIssue($("cpNew").value));
      if ($("cpNew").value !== $("cpNew2").value) return err("The two new passwords do not match.");
      u.pass = Store.hash($("cpNew").value); Store.saveUsers(users);
      e.target.reset(); err(""); toast("Password changed");
    };
  }
});
