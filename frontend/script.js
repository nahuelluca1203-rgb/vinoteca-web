const content = document.getElementById("content");
const pageName = document.getElementById("pageName");
const links = document.querySelectorAll(".nav-link");

const pages = {
    inicio: {
        title: "Panel principal",
        description: "Resumen general de EIKVOR.",
        render: `
            <div class="stats-grid">
                <div class="stat-card">
                    <span>Ventas del día</span>
                    <h3>$0</h3>
                </div>
                <div class="stat-card">
                    <span>Productos registrados</span>
                    <h3>0</h3>
                </div>
                <div class="stat-card">
                    <span>Pedidos pendientes</span>
                    <h3>0</h3>
                </div>
                <div class="stat-card">
                    <span>Sucursales</span>
                    <h3>0</h3>
                </div>
            </div>

            <div class="panel-card">
                <h3>Bienvenido a EIKVOR</h3>
                <p>
                    Desde este panel podrás administrar las ventas,
                    productos, inventario, compras y sucursales.
                </p>
            </div>

            <div class="panel-card">
                <h3>Actividad reciente</h3>
                <div class="empty-state">
                    Todavía no hay movimientos registrados.
                </div>
            </div>
        `
    },

    caja: {
        title: "Caja",
        description: "Punto de venta de EIKVOR.",
        render: `<div class="panel-card">
            <h3>Punto de venta</h3>
            <p>Aquí construiremos el buscador de productos, lector de códigos, carrito, Lista 1, Lista 2 y cobro.</p>
        </div>`
    },

    productos: {
    title: "Productos",
    description: "Administración de productos.",
    render: `
        <div id="productsModule"></div>
    `
},
    

    inventario: {
        title: "Inventario",
        description: "Control de stock por sucursal.",
        render: `<div class="panel-card">
            <h3>Stock general</h3>
            <p>Aquí consultaremos las existencias, vencimientos y movimientos de mercadería.</p>
        </div>`
    },

    ventas: {
        title: "Ventas",
        description: "Historial de operaciones.",
        render: `<div class="panel-card">
            <h3>Historial de ventas</h3>
            <p>Aquí aparecerán las ventas realizadas por fecha, empleado y sucursal.</p>
        </div>`
    },

    compras: {
        title: "Compras y boletas",
        description: "Registro de mercadería recibida.",
        render: `<div class="panel-card">
            <h3>Registrar compra</h3>
            <p>Aquí cargaremos las facturas y boletas de proveedores.</p>
        </div>`
    },

    proveedores: {
        title: "Proveedores",
        description: "Administración de proveedores.",
        render: `<div class="panel-card">
            <h3>Proveedores registrados</h3>
            <p>Aquí consultaremos datos, compras e historial de cada proveedor.</p>
        </div>`
    },

    pedidos: {
        title: "Pedidos a proveedores",
        description: "Solicitud de mercadería.",
        render: `<div class="panel-card">
            <h3>Pedidos</h3>
            <p>Aquí prepararemos y consultaremos pedidos de mercadería.</p>
        </div>`
    },

    traspasos: {
        title: "Traspasos",
        description: "Movimiento de productos entre sucursales.",
        render: `<div class="panel-card">
            <h3>Traspasos de stock</h3>
            <p>Aquí registraremos los envíos de mercadería entre locales.</p>
        </div>`
    },

    movimientos: {
        title: "Movimientos",
        description: "Registro general de operaciones.",
        render: `<div class="panel-card">
            <h3>Movimientos generales</h3>
            <p>Aquí consultaremos los movimientos de caja e inventario.</p>
        </div>`
    },

    clientes: {
        title: "Clientes",
        description: "Administración de clientes.",
        render: `<div class="panel-card">
            <h3>Clientes registrados</h3>
            <p>Aquí consultaremos las cuentas y el historial de compras.</p>
        </div>`
    },

    informes: {
        title: "Informes",
        description: "Estadísticas y resultados.",
        render: `<div class="panel-card">
            <h3>Informes y estadísticas</h3>
            <p>Aquí construiremos los informes de ventas, costos y stock.</p>
        </div>`
    },

    usuarios: {
        title: "Sucursales y usuarios",
        description: "Administración del sistema.",
        render: `<div class="panel-card">
            <h3>Configuración general</h3>
            <p>Aquí administraremos las sucursales, empleados, roles y permisos.</p>
        </div>`
    }
};
// ======================================
// MODULO DE PRODUCTOS - EIKVOR
// ======================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

async function renderProducts() {
    const module = document.getElementById("productsModule");

    if (!module) return;

    module.innerHTML = `
        <div class="panel-card">
            <h3>Registrar producto</h3>

            <form id="productForm">
                <div class="form-grid">
                    <div>
                        <label>Código</label>
                        <input type="text" name="code" placeholder="Ej: VIN001">
                    </div>

                    <div>
                        <label>Nombre del producto *</label>
                        <input type="text" name="name" required placeholder="Nombre">
                    </div>

                    <div>
                        <label>Descripción</label>
                        <input type="text" name="description" placeholder="Descripción">
                    </div>

                    <div>
                        <label>Costo</label>
                        <input type="number" name="cost" min="0" step="0.01" value="0">
                    </div>

                    <div>
                        <label>Precio de venta</label>
                        <input type="number" name="sale_price" min="0" step="0.01" value="0">
                    </div>

                    <div>
                        <label>Stock inicial</label>
                        <input type="number" name="quantity" min="0" step="0.01" value="0">
                    </div>

                    <div>
                        <label>Stock mínimo</label>
                        <input type="number" name="min_stock" min="0" step="0.01" value="0">
                    </div>
                </div>

                <div style="margin-top:15px; display:flex; gap:10px;">
                    <button type="submit" id="saveProduct">
                        Guardar producto
                    </button>

                    <button type="button" id="cancelEdit" hidden>
                        Cancelar edición
                    </button>
                </div>

                <p id="productMessage"></p>
            </form>
        </div>

        <div class="panel-card">
            <h3>Productos registrados</h3>

            <input
                type="search"
                id="productSearch"
                placeholder="Buscar por nombre o código..."
                style="width:100%; margin-bottom:15px;"
            >

            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Costo</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody id="productsTable">
                        <tr>
                            <td colspan="6">Cargando productos...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const form = document.getElementById("productForm");
    const table = document.getElementById("productsTable");
    const message = document.getElementById("productMessage");
    const saveButton = document.getElementById("saveProduct");
    const cancelButton = document.getElementById("cancelEdit");
    const search = document.getElementById("productSearch");

    let products = [];
    let editingId = null;

    // CARGAR PRODUCTOS
    async function loadProducts() {
        try {
            const response = await fetch("/api/productos");

            if (!response.ok) {
                throw new Error("No se pudieron consultar los productos");
            }

            products = await response.json();
            showProducts(products);

        } catch (error) {
            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        Error al cargar productos: ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;
        }
    }

    // MOSTRAR PRODUCTOS
    function showProducts(list) {
        if (list.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6">No hay productos registrados.</td>
                </tr>
            `;
            return;
        }

        table.innerHTML = list.map(product => `
            <tr>
                <td>${escapeHTML(product.code || "-")}</td>
                <td>${escapeHTML(product.name)}</td>
                <td>$${Number(product.cost || 0).toLocaleString("es-AR")}</td>
                <td>$${Number(product.sale_price || 0).toLocaleString("es-AR")}</td>
                <td>${Number(product.stock || 0)}</td>
                <td>
                    <button type="button" data-action="edit" data-id="${product.id}">
                        Editar
                    </button>

                    <button type="button" data-action="delete" data-id="${product.id}">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join("");
    }

    // BUSCAR PRODUCTOS
    search.addEventListener("input", () => {
        const term = search.value.toLowerCase();

        const filtered = products.filter(product =>
            (product.name || "").toLowerCase().includes(term) ||
            (product.code || "").toLowerCase().includes(term)
        );

        showProducts(filtered);
    });

    // GUARDAR O MODIFICAR
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = Object.fromEntries(new FormData(form).entries());

        if (!data.name.trim()) {
            message.textContent = "El nombre es obligatorio.";
            return;
        }

        const editing = editingId !== null;

        const url = editing
            ? `/api/productos/${editingId}`
            : "/api/productos";

        try {
            saveButton.disabled = true;
            saveButton.textContent = "Guardando...";

            const response = await fetch(url, {
                method: editing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...data,
                    cost: Number(data.cost),
                    sale_price: Number(data.sale_price),
                    min_stock: Number(data.min_stock),
                    quantity: Number(data.quantity)
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al guardar");
            }

            message.textContent = result.message;
            form.reset();
            editingId = null;
            saveButton.textContent = "Guardar producto";
            cancelButton.hidden = true;

            await loadProducts();

        } catch (error) {
            message.textContent = error.message;

        } finally {
            saveButton.disabled = false;

            if (editingId === null) {
                saveButton.textContent = "Guardar producto";
            }
        }
    });

    // EDITAR O ELIMINAR
    table.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const id = Number(button.dataset.id);
        const action = button.dataset.action;

        if (action === "edit") {
            const product = products.find(item => item.id === id);

            if (!product) return;

            editingId = id;

            form.elements.code.value = product.code || "";
            form.elements.name.value = product.name || "";
            form.elements.description.value = product.description || "";
            form.elements.cost.value = product.cost || 0;
            form.elements.sale_price.value = product.sale_price || 0;
            form.elements.min_stock.value = product.min_stock || 0;
            form.elements.quantity.value = product.stock || 0;

            saveButton.textContent = "Actualizar producto";
            cancelButton.hidden = false;
            message.textContent = "Editando producto: " + product.name;

            form.scrollIntoView({ behavior: "smooth" });
        }

        if (action === "delete") {
            const product = products.find(item => item.id === id);

            if (!product) return;

            if (!confirm(`¿Querés eliminar ${product.name}?`)) {
                return;
            }

            try {
                const response = await fetch(`/api/productos/${id}`, {
                    method: "DELETE"
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Error al eliminar");
                }

                message.textContent = result.message;
                await loadProducts();

            } catch (error) {
                message.textContent = error.message;
            }
        }
    });

    // CANCELAR EDICIÓN
    cancelButton.addEventListener("click", () => {
        form.reset();
        editingId = null;
        saveButton.textContent = "Guardar producto";
        cancelButton.hidden = true;
        message.textContent = "";
    });

    await loadProducts();
}

// ROUTER

function navigateTo(page) {
    const selectedPage = pages[page];

    if (!selectedPage) {
        return;
    }

    content.innerHTML = `
        <div class="page-header">
            <h2>${selectedPage.title}</h2>
            <p>${selectedPage.description}</p>
        </div>

        ${selectedPage.render}
    `;

    pageName.textContent = selectedPage.title;

    if (page === "productos") {
    renderProducts();
}

    links.forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === page
        );
    });

    document.getElementById("sidebar").classList.remove("open");

    window.location.hash = page;
}

// EVENTOS DEL MENÚ

links.forEach(link => {
    link.addEventListener("click", () => {
        navigateTo(link.dataset.page);
    });
});

// MENÚ PARA CELULARES

document.getElementById("menuToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});

// NAVEGACIÓN CON EL HISTORIAL

window.addEventListener("hashchange", () => {
    const page = window.location.hash.substring(1) || "inicio";
    navigateTo(page);
});

// INICIO

const initialPage = window.location.hash.substring(1) || "inicio";
navigateTo(initialPage);









