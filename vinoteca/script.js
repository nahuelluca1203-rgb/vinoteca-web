const KEY = "maison_vinoteca_v2";

const initialProducts = [
 {id:1,name:"Malbec Reserva",winery:"Bodega Norton",type:"TINTO",price:18000,stock:25},
 {id:2,name:"Malbec Clásico",winery:"Trapiche",type:"TINTO",price:12000,stock:30},
 {id:3,name:"Cabernet Sauvignon",winery:"Bodega Catena",type:"TINTO",price:25000,stock:18},
 {id:4,name:"Cabernet Reserva",winery:"Luigi Bosca",type:"TINTO",price:32000,stock:12},
 {id:5,name:"Chardonnay",winery:"Salentein",type:"BLANCO",price:16000,stock:20},
 {id:6,name:"Chardonnay Reserva",winery:"Bodega Norton",type:"BLANCO",price:22000,stock:15},
 {id:7,name:"Rosado de Malbec",winery:"Santa Julia",type:"ROSADO",price:11000,stock:28},
 {id:8,name:"Malbec Gran Reserva",winery:"Salentein",type:"TINTO",price:38000,stock:10},
 {id:9,name:"Blend Reserva",winery:"Bodega Catena",type:"TINTO",price:42000,stock:8},
 {id:10,name:"Syrah",winery:"Finca Las Moras",type:"TINTO",price:14000,stock:22},
 {id:11,name:"Pinot Noir",winery:"Luigi Bosca",type:"TINTO",price:28000,stock:14},
 {id:12,name:"Torrontés",winery:"El Esteco",type:"BLANCO",price:13000,stock:25},
 {id:13,name:"Malbec Premium",winery:"Bodega Catena",type:"TINTO",price:45000,stock:7},
 {id:14,name:"Bonarda",winery:"Nieto Senetiner",type:"TINTO",price:15000,stock:19},
 {id:15,name:"Espumante Brut",winery:"Chandon",type:"ESPUMANTE",price:30000,stock:11}
];

let state = loadState();

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {
      products: initialProducts,
      sales: [],
      purchases: [],
      movements: [],
      suppliers: [],
      clients: []
    };
  } catch {
    return {
      products: initialProducts,
      sales: [],
      purchases: [],
      movements: [],
      suppliers: [],
      clients: []
    };
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

const $ = id => document.getElementById(id);

const money = n => new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
}).format(n || 0);

const dateNow = () => new Date().toLocaleString("es-AR", {
  dateStyle: "short",
  timeStyle: "short"
});

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function navigate(page) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.toggle("active", p.id === `page-${page}`);
  });

  document.querySelectorAll(".nav-link").forEach(b => {
    b.classList.toggle("active", b.dataset.page === page);
  });

  const active = document.querySelector(`[data-page="${page}"]`);

  $("pageTitle").textContent = active
    ? active.textContent.trim()
    : "Resumen general";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  const p = state.products;
  const units = p.reduce((a, x) => a + Number(x.stock), 0);
  const value = p.reduce((a, x) => a + x.price * x.stock, 0);

  $("statProductos").textContent = p.length;
  $("statStock").textContent = units;
  $("statValor").textContent = money(value);
  $("statCritico").textContent = p.filter(x => x.stock <= 5).length;

  renderProducts();
  renderMovements();
  renderSales();
  renderCategories();
  renderSuppliers();
  renderClients();
  renderReports();
  fillProductSelects();
  renderRecent();
}

function renderProducts() {
  const q = ($("searchProducts")?.value || "").toLowerCase();
  const type = $("filterType")?.value || "";
  const stock = $("filterStock")?.value || "";

  const list = state.products.filter(p =>
    (p.name.toLowerCase().includes(q) ||
     p.winery.toLowerCase().includes(q)) &&
    (!type || p.type === type) &&
    (!stock ||
      (stock === "low" ? p.stock > 0 && p.stock <= 5 : p.stock === 0))
  );

  $("productRows").innerHTML = list.length
    ? list.map(p => `
      <tr>
        <td><b>${esc(p.name)}</b></td>
        <td>${esc(p.winery)}</td>
        <td>${p.type}</td>
        <td>${money(p.price)}</td>
        <td>${p.stock}</td>
        <td>
          <span class="badge ${
            p.stock === 0 ? "empty" : p.stock <= 5 ? "low" : ""
          }">
            ${p.stock === 0 ? "Agotado" :
              p.stock <= 5 ? "Stock crítico" : "Disponible"}
          </span>
        </td>
        <td>
          <button class="table-action" data-edit="${p.id}">Editar</button>
          <button class="table-action delete" data-delete="${p.id}">Borrar</button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="7">No hay productos para mostrar.</td></tr>`;
}

function renderRecent() {
  const rows = state.movements.slice(-6).reverse();

  $("recentRows").innerHTML = rows.length
    ? rows.map(m => `
      <tr>
        <td>${m.date}</td>
        <td>${m.kind}</td>
        <td>${esc(m.product)}</td>
        <td>${m.qty}</td>
        <td>${esc(m.detail)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">Todavía no hay movimientos registrados.</td></tr>`;
}

function renderMovements() {
  $("movementRows").innerHTML = state.movements.length
    ? state.movements.slice().reverse().map(m => `
      <tr>
        <td>${m.date}</td>
        <td><span class="badge">${m.kind}</span></td>
        <td>${esc(m.product)}</td>
        <td>${m.qty}</td>
        <td>${esc(m.detail)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">Sin movimientos.</td></tr>`;
}

function renderSales() {
  $("salesRows").innerHTML = state.sales.length
    ? state.sales.slice().reverse().map(s => `
      <tr>
        <td>${s.date}</td>
        <td>${esc(s.product)}</td>
        <td>${s.qty}</td>
        <td>${esc(s.client || "Consumidor final")}</td>
        <td>${money(s.total)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">Todavía no hay ventas.</td></tr>`;
}

function renderCategories() {
  const types = ["TINTO", "BLANCO", "ROSADO", "ESPUMANTE"];

  $("categoryCards").innerHTML = types.map(t => {
    const items = state.products.filter(p => p.type === t);

    return `
      <article class="category-card">
        <span class="eyebrow">CATEGORÍA</span>
        <b>${t}</b>
        <small>${items.length} productos · ${
          items.reduce((a, p) => a + p.stock, 0)
        } unidades</small>
      </article>
    `;
  }).join("");
}

function renderSuppliers() {
  $("supplierRows").innerHTML = state.suppliers.length
    ? state.suppliers.map(s => `
      <tr>
        <td>${esc(s.name)}</td>
        <td>${esc(s.contact)}</td>
        <td>${esc(s.note)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3">Todavía no hay proveedores. Usá “Nuevo proveedor” para agregar uno.</td></tr>`;
}

function renderClients() {
  $("clientRows").innerHTML = state.clients.length
    ? state.clients.map(c => `
      <tr>
        <td>${esc(c.name)}</td>
        <td>${esc(c.contact)}</td>
        <td>${state.sales.filter(s => s.client === c.name).length}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3">Todavía no hay clientes registrados.</td></tr>`;
}

function renderReports() {
  const units = state.products.reduce((a, p) => a + p.stock, 0);
  const value = state.products.reduce((a, p) => a + p.stock * p.price, 0);

  $("reportUnits").textContent = units;
  $("reportValue").textContent = money(value);
  $("reportSales").textContent = state.sales.length;
  $("reportPurchases").textContent = state.purchases.length;

  const types = ["TINTO", "BLANCO", "ROSADO", "ESPUMANTE"];

  const max = Math.max(
    1,
    ...types.map(t => state.products.filter(p => p.type === t).length)
  );

  $("typeBars").innerHTML = types.map(t => {
    const n = state.products.filter(p => p.type === t).length;

    return `
      <div class="bar-row">
        <b>${t}</b>
        <div class="bar-track">
          <div class="bar-fill" style="width:${n / max * 100}%"></div>
        </div>
        <span>${n}</span>
      </div>
    `;
  }).join("");
}

function fillProductSelects() {
  ["saleProduct", "purchaseProduct"].forEach(id => {
    const el = $(id);
    const old = el.value;

    el.innerHTML = state.products.map(p => `
      <option value="${p.id}">${esc(p.name)} · stock ${p.stock}</option>
    `).join("");

    if ([...el.options].some(o => o.value === old)) {
      el.value = old;
    }
  });
}

function openProduct(p) {
  $("productForm").reset();

  $("productId").value = p?.id || "";
  $("productName").value = p?.name || "";
  $("productWinery").value = p?.winery || "";
  $("productType").value = p?.type || "TINTO";
  $("productPrice").value = p?.price ?? "";
  $("productStock").value = p?.stock ?? "";

  $("dialogTitle").textContent = p
    ? "Editar producto"
    : "Nuevo producto";

  $("productDialog").showModal();
}

function recordMovement(kind, p, qty, detail) {
  state.movements.push({
    date: dateNow(),
    kind,
    product: p.name,
    qty,
    detail
  });
}

function addProduct(e) {
  e.preventDefault();

  const id = Number($("productId").value);

  const item = {
    id: id || Date.now(),
    name: $("productName").value.trim(),
    winery: $("productWinery").value.trim(),
    type: $("productType").value,
    price: Number($("productPrice").value),
    stock: Number($("productStock").value)
  };

  if (!item.name || !item.winery || item.price < 0 || item.stock < 0) {
    return toast("Revisá los datos del producto.");
  }

  if (id) {
    const old = state.products.find(p => p.id === id);

    if (old && old.stock !== item.stock) {
      recordMovement(
        "AJUSTE",
        item,
        Math.abs(item.stock - old.stock),
        "Edición de inventario"
      );
    }

    state.products = state.products.map(p =>
      p.id === id ? item : p
    );
  } else {
    state.products.push(item);
  }

  save();
  $("productDialog").close();
  render();
  toast("Producto guardado correctamente.");
}

function registerSale(e) {
  e.preventDefault();

  const p = state.products.find(
    p => p.id === Number($("saleProduct").value)
  );

  const qty = Number($("saleQty").value);
  const client = $("saleClient").value.trim();

  if (!p || qty < 1) {
    return toast("Seleccioná un producto y una cantidad válida.");
  }

  if (p.stock < qty) {
    return toast("No hay stock suficiente.");
  }

  p.stock -= qty;

  const sale = {
    date: dateNow(),
    product: p.name,
    qty,
    client,
    total: p.price * qty
  };

  state.sales.push(sale);
  recordMovement("VENTA", p, qty, client || "Consumidor final");

  if (
    client &&
    !state.clients.some(c => c.name.toLowerCase() === client.toLowerCase())
  ) {
    state.clients.push({ name: client, contact: "", note: "" });
  }

  save();
  e.target.reset();
  render();
  toast("Venta registrada y stock actualizado.");
}

function registerPurchase(e) {
  e.preventDefault();

  const p = state.products.find(
    p => p.id === Number($("purchaseProduct").value)
  );

  const qty = Number($("purchaseQty").value);
  const supplier = $("purchaseSupplier").value.trim();

  if (!p || qty < 1) {
    return toast("Ingresá una cantidad válida.");
  }

  p.stock += qty;

  state.purchases.push({
    date: dateNow(),
    product: p.name,
    qty,
    supplier
  });

  recordMovement(
    "COMPRA",
    p,
    qty,
    supplier || "Compra registrada"
  );

  save();
  e.target.reset();
  render();
  toast("Compra registrada y stock actualizado.");
}

function exportCSV() {
  const rows = [
    ["ID", "Producto", "Bodega", "Categoría", "Precio", "Stock"],
    ...state.products.map(p => [
      p.id, p.name, p.winery, p.type, p.price, p.stock
    ])
  ];

  const csv = "\uFEFF" + rows.map(r =>
    r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")
  ).join("\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  );

  const a = document.createElement("a");
  a.href = url;
  a.download = "inventario-maison.csv";
  a.click();

  URL.revokeObjectURL(url);
}

function addSimpleRecord(kind) {
  const name = prompt(
    kind === "supplier"
      ? "Nombre del proveedor:"
      : "Nombre del cliente:"
  );

  if (!name?.trim()) return;

  const contact = prompt("Teléfono o contacto (opcional):") || "";

  if (kind === "supplier") {
    state.suppliers.push({
      name: name.trim(),
      contact,
      note: ""
    });
  } else {
    state.clients.push({
      name: name.trim(),
      contact,
      note: ""
    });
  }

  save();
  render();
  toast("Registro agregado.");
}

document.addEventListener("DOMContentLoaded", () => {
  $("fecha").textContent = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).toUpperCase();

  $("menu").addEventListener("click", e => {
    const b = e.target.closest("[data-page]");
    if (b) navigate(b.dataset.page);
  });

  document.addEventListener("click", e => {
    const go = e.target.closest("[data-go]");
    if (go) navigate(go.dataset.go);
  });

  $("addProduct").addEventListener("click", () => openProduct());
  $("productForm").addEventListener("submit", addProduct);

  $("closeDialog").addEventListener("click", () =>
    $("productDialog").close()
  );

  $("cancelDialog").addEventListener("click", () =>
    $("productDialog").close()
  );

  $("productRows").addEventListener("click", e => {
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-delete]");

    if (edit) {
      const p = state.products.find(
        x => x.id === Number(edit.dataset.edit)
      );

      if (p) openProduct(p);
    }

    if (del) {
      const p = state.products.find(
        x => x.id === Number(del.dataset.delete)
      );

      if (p && confirm(`¿Eliminar ${p.name}?`)) {
        state.products = state.products.filter(x => x.id !== p.id);
        save();
        render();
        toast("Producto eliminado.");
      }
    }
  });

  ["searchProducts", "filterType", "filterStock"].forEach(id => {
    $(id).addEventListener("input", renderProducts);
  });

  $("saleForm").addEventListener("submit", registerSale);
  $("purchaseForm").addEventListener("submit", registerPurchase);

  $("addSupplier").addEventListener("click", () =>
    addSimpleRecord("supplier")
  );

  $("addClient").addEventListener("click", () =>
    addSimpleRecord("client")
  );

  $("exportCsv").addEventListener("click", exportCSV);

  $("resetData").addEventListener("click", () => {
    if (confirm("Esto reemplazará los datos guardados por los datos iniciales de ejemplo. ¿Continuar?")) {
      state = {
        products: initialProducts.map(p => ({ ...p })),
        sales: [],
        purchases: [],
        movements: [],
        suppliers: [],
        clients: []
      };

      save();
      render();
      toast("Datos de ejemplo restaurados.");
    }
  });

  render();
});