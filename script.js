// ===== Helpers =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const money = (n) => `$${n.toFixed(2)}`;

// ===== Products =====
const PRODUCTS = [
  { id: "p1", name: "Wireless Headphones", price: 120, category: "tech", desc: "Clean sound, strong bass, all-day comfort." },
  { id: "p2", name: "Smart Watch", price: 180, category: "tech", desc: "Health tracking, notifications, premium build." },
  { id: "p3", name: "Designer Jacket", price: 95, category: "fashion", desc: "Modern fit, soft fabric, everyday style." },
  { id: "p4", name: "Running Shoes", price: 75, category: "fashion", desc: "Lightweight, breathable, made for speed." },
  { id: "p5", name: "Modern Lamp", price: 60, category: "home", desc: "Warm glow, minimalist design, cozy vibes." },
  { id: "p6", name: "Office Chair", price: 210, category: "home", desc: "Ergonomic support for long sessions." },
];

// ===== State =====
const CART_KEY = "novastore_cart_v1";
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); // [{id, qty}]

// ===== Elements =====
const productGrid = $("#productGrid");
const cartCount = $("#cartCount");
const drawer = $("#drawer");
const cartOpen = $("#cartOpen");
const cartClose = $("#cartClose");
const cartItems = $("#cartItems");
const clearCartBtn = $("#clearCart");
const goCheckoutBtn = $("#goCheckout");

const cartSubtotalEl = $("#cartSubtotal");
const cartShippingEl = $("#cartShipping");
const cartTaxEl = $("#cartTax");
const cartTotalEl = $("#cartTotal");

const kpiItems = $("#kpiItems");
const kpiSubtotal = $("#kpiSubtotal");

const viewShop = $("#viewShop");
const viewCheckout = $("#viewCheckout");
const backToShop = $("#backToShop");

const summaryRows = $("#summaryRows");
const sumSubtotal = $("#sumSubtotal");
const sumShipping = $("#sumShipping");
const sumTax = $("#sumTax");
const sumTotal = $("#sumTotal");

// Modal
const modal = $("#modal");
const modalClose = $("#modalClose");
const modalTitle = $("#modalTitle");
const modalDesc = $("#modalDesc");
const modalPrice = $("#modalPrice");
const modalThumb = $("#modalThumb");
const modalAdd = $("#modalAdd");
let modalProductId = null;

// Theme
const themeToggle = $("#themeToggle");

// Progress
const progressBar = $("#progressBar");

// Filters
const filterBtns = $$(".chip");
let currentFilter = "all";

// Checkout form
const checkoutForm = $("#checkoutForm");
const checkoutNote = $("#checkoutNote");

// ===== Theme (persist) =====
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("novastore_theme", theme);
  const icon = themeToggle?.querySelector(".icon");
  if (icon) icon.textContent = theme === "light" ? "☀" : "☾";
}
const savedTheme = localStorage.getItem("novastore_theme");
setTheme(savedTheme === "light" ? "light" : "dark");

themeToggle?.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(current === "dark" ? "light" : "dark");
});

// ===== Progress bar =====
function updateProgress() {
  if (!progressBar) return;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight =
    (document.documentElement.scrollHeight || document.body.scrollHeight) -
    document.documentElement.clientHeight;
  const p = scrollHeight ? (scrollTop / scrollHeight) * 100 : 0;
  progressBar.style.width = `${p.toFixed(2)}%`;
}
window.addEventListener("scroll", updateProgress);
window.addEventListener("resize", updateProgress);
updateProgress();

// ===== Cart helpers =====
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}
function getCartCount() {
  return cart.reduce((acc, it) => acc + it.qty, 0);
}
function calcSubtotal() {
  return cart.reduce((sum, it) => {
    const p = getProduct(it.id);
    return sum + (p ? p.price * it.qty : 0);
  }, 0);
}
function calcShipping(subtotal) {
  if (subtotal === 0) return 0;
  return subtotal >= 200 ? 0 : 6.99;
}
function calcTax(subtotal) {
  return subtotal * 0.08; // demo 8%
}
function totals() {
  const subtotal = calcSubtotal();
  const shipping = calcShipping(subtotal);
  const tax = calcTax(subtotal);
  const total = subtotal + shipping + tax;
  return { subtotal, shipping, tax, total };
}
function updateBadges() {
  const { subtotal } = totals();
  if (cartCount) cartCount.textContent = String(getCartCount());
  if (kpiItems) kpiItems.textContent = String(getCartCount());
  if (kpiSubtotal) kpiSubtotal.textContent = money(subtotal);
  saveCart();
}

function renderCart() {
  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `<div class="muted" style="padding:10px 2px;font-weight:900;">Your cart is empty.</div>`;
  } else {
    cartItems.innerHTML = cart.map(it => {
      const p = getProduct(it.id);
      if (!p) return "";
      const line = p.price * it.qty;
      return `
        <div class="item" data-id="${p.id}">
          <div class="item__top">
            <div>
              <div class="item__name">${p.name}</div>
              <div class="item__meta">${money(p.price)} • Line: <strong>${money(line)}</strong></div>
            </div>
            <button class="remove" type="button" data-remove="${p.id}">Remove</button>
          </div>

          <div class="item__controls">
            <div class="qty" aria-label="Quantity controls">
              <button type="button" data-dec="${p.id}" aria-label="Decrease">−</button>
              <span>${it.qty}</span>
              <button type="button" data-inc="${p.id}" aria-label="Increase">+</button>
            </div>
            <span class="muted">Category: <strong>${p.category}</strong></span>
          </div>
        </div>
      `;
    }).join("");
  }

  const t = totals();
  cartSubtotalEl.textContent = money(t.subtotal);
  cartShippingEl.textContent = money(t.shipping);
  cartTaxEl.textContent = money(t.tax);
  cartTotalEl.textContent = money(t.total);

  updateBadges();
}

function addToCart(id, qty = 1) {
  const found = cart.find(it => it.id === id);
  if (found) found.qty += qty;
  else cart.push({ id, qty });
  renderCart();
}
function setQty(id, qty) {
  const it = cart.find(x => x.id === id);
  if (!it) return;
  it.qty = Math.max(1, qty);
  renderCart();
}
function removeFromCart(id) {
  cart = cart.filter(it => it.id !== id);
  renderCart();
}

// ===== Drawer =====
function openDrawer() {
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
cartOpen?.addEventListener("click", openDrawer);
cartClose?.addEventListener("click", closeDrawer);
drawer?.addEventListener("click", (e) => { if (e.target === drawer) closeDrawer(); });

// cart actions
clearCartBtn?.addEventListener("click", () => {
  cart = [];
  renderCart();
});

cartItems?.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]")?.getAttribute("data-inc");
  const dec = e.target.closest("[data-dec]")?.getAttribute("data-dec");
  const rem = e.target.closest("[data-remove]")?.getAttribute("data-remove");

  if (inc) {
    const it = cart.find(x => x.id === inc);
    if (it) setQty(inc, it.qty + 1);
  }
  if (dec) {
    const it = cart.find(x => x.id === dec);
    if (it) setQty(dec, it.qty - 1);
  }
  if (rem) removeFromCart(rem);
});

// ===== Checkout View =====
function showShop() {
  viewShop.classList.add("is-active");
  viewCheckout.classList.remove("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showCheckout() {
  if (cart.length === 0) {
    openDrawer();
    return;
  }
  viewShop.classList.remove("is-active");
  viewCheckout.classList.add("is-active");
  closeDrawer();
  renderSummary();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
goCheckoutBtn?.addEventListener("click", showCheckout);
backToShop?.addEventListener("click", showShop);

function renderSummary() {
  if (!summaryRows) return;

  if (cart.length === 0) {
    summaryRows.innerHTML = `<div class="muted" style="font-weight:900;">No items.</div>`;
  } else {
    summaryRows.innerHTML = cart.map(it => {
      const p = getProduct(it.id);
      const line = p.price * it.qty;
      return `
        <div class="srow">
          <div>
            <div class="l">${p.name}</div>
            <div class="m">${it.qty} × ${money(p.price)}</div>
          </div>
          <strong>${money(line)}</strong>
        </div>
      `;
    }).join("");
  }

  const t = totals();
  sumSubtotal.textContent = money(t.subtotal);
  sumShipping.textContent = money(t.shipping);
  sumTax.textContent = money(t.tax);
  sumTotal.textContent = money(t.total);
}

// ===== Products render + filter =====
function tintByCategory(cat) {
  if (cat === "tech") return `linear-gradient(135deg, rgba(56,189,248,.18), rgba(124,58,237,.16))`;
  if (cat === "fashion") return `linear-gradient(135deg, rgba(124,58,237,.18), rgba(34,197,94,.14))`;
  return `linear-gradient(135deg, rgba(34,197,94,.16), rgba(56,189,248,.14))`;
}

function renderProducts() {
  if (!productGrid) return;

  const items = currentFilter === "all"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === currentFilter);

  productGrid.innerHTML = items.map(p => `
    <article class="card">
      <div class="thumb" style="background:${tintByCategory(p.category)}"></div>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="price">${money(p.price)}</div>

      <div class="card__actions">
        <button class="mini-btn" type="button" data-quick="${p.id}">Quick view</button>
        <button class="btn" type="button" data-add="${p.id}">Add to cart</button>
      </div>
    </article>
  `).join("");
}

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => {
      b.classList.remove("is-active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("is-active");
    btn.setAttribute("aria-selected", "true");
    currentFilter = btn.getAttribute("data-filter") || "all";
    renderProducts();
  });
});

productGrid?.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]")?.getAttribute("data-add");
  const quick = e.target.closest("[data-quick]")?.getAttribute("data-quick");

  if (add) addToCart(add, 1);
  if (quick) openModal(quick);
});

// ===== Modal =====
function openModal(id) {
  const p = getProduct(id);
  if (!p) return;

  modalProductId = id;
  modalTitle.textContent = p.name;
  modalDesc.textContent = p.desc;
  modalPrice.textContent = money(p.price);

  modalThumb.style.background =
    `radial-gradient(520px 240px at 30% 35%, rgba(124,58,237,.22), transparent 60%),
     radial-gradient(520px 240px at 75% 55%, rgba(56,189,248,.18), transparent 60%),
     radial-gradient(520px 240px at 55% 80%, rgba(34,197,94,.14), transparent 60%),
     ${tintByCategory(p.category)}`;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
modalClose?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
modalAdd?.addEventListener("click", () => {
  if (!modalProductId) return;
  addToCart(modalProductId, 1);
  closeModal();
});

// ===== Keyboard ESC =====
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (drawer.classList.contains("is-open")) closeDrawer();
  if (modal.classList.contains("is-open")) closeModal();
});

// ===== Checkout validation (demo) =====
function setErr(input, msg) {
  input.classList.add("bad");
  const err = input.closest("label")?.querySelector(".err");
  if (err) err.textContent = msg || "";
}
function clearErr(input) {
  input.classList.remove("bad");
  const err = input.closest("label")?.querySelector(".err");
  if (err) err.textContent = "";
}
function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

checkoutForm?.addEventListener("input", (e) => {
  const el = e.target;
  if (el.matches("input, textarea")) {
    clearErr(el);
    if (checkoutNote) checkoutNote.textContent = "";
  }
});

checkoutForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (checkoutNote) checkoutNote.textContent = "";

  const name = checkoutForm.elements["name"];
  const email = checkoutForm.elements["email"];
  const address = checkoutForm.elements["address"];
  const postcode = checkoutForm.elements["postcode"];

  let ok = true;

  if (!name.value.trim() || name.value.trim().length < 2) { setErr(name, "Enter your name."); ok = false; }
  if (!email.value.trim() || !isEmail(email.value.trim())) { setErr(email, "Enter a valid email."); ok = false; }
  if (!address.value.trim() || address.value.trim().length < 6) { setErr(address, "Enter a valid address."); ok = false; }
  if (!postcode.value.trim() || postcode.value.trim().length < 4) { setErr(postcode, "Enter a valid postcode."); ok = false; }
  if (cart.length === 0) { ok = false; if (checkoutNote) checkoutNote.textContent = "Cart is empty."; }

  if (!ok) {
    if (checkoutNote) checkoutNote.textContent = "Fix the highlighted fields and try again.";
    return;
  }

  if (checkoutNote) checkoutNote.textContent = "✅ Order placed (demo). Connect payment + backend later.";
  cart = [];
  renderCart();
  renderSummary();
});

// ===== Init =====
renderProducts();
renderCart();