-- =========================================================
-- EIKVOR - BASE DE DATOS
-- Motor: PostgreSQL
-- =========================================================

BEGIN;

-- 1. SUCURSALES
CREATE TABLE branches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200),
    phone VARCHAR(40),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CAJAS
CREATE TABLE cash_registers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    name VARCHAR(60) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(branch_id, name),
    UNIQUE(id, branch_id)
);

-- 3. ROLES Y PERMISOS
CREATE TABLE roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE permissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(180) NOT NULL
);

CREATE TABLE role_permissions (
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

-- 4. USUARIOS
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150),
    role_id BIGINT NOT NULL REFERENCES roles(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_branch_access (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    branch_id BIGINT REFERENCES branches(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id, branch_id)
);

CREATE TABLE user_register_access (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    cash_register_id BIGINT REFERENCES cash_registers(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id, cash_register_id)
);

-- 5. SESIONES DE CAJA
CREATE TABLE cash_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cash_register_id BIGINT NOT NULL REFERENCES cash_registers(id),
    opened_by BIGINT NOT NULL REFERENCES users(id),
    closed_by BIGINT REFERENCES users(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(opening_amount >= 0),
    expected_amount NUMERIC(14,2),
    counted_amount NUMERIC(14,2),
    difference_amount NUMERIC(14,2),
    status VARCHAR(15) NOT NULL DEFAULT 'OPEN'
        CHECK(status IN ('OPEN', 'CLOSED')),
    notes TEXT,
    CHECK (
        (status = 'OPEN' AND closed_at IS NULL AND closed_by IS NULL)
        OR
        (status = 'CLOSED' AND closed_at IS NOT NULL AND closed_by IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_one_open_session_per_register
ON cash_sessions(cash_register_id)
WHERE status = 'OPEN';

-- 6. CATEGORÍAS
CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. PROVEEDORES
CREATE TABLE suppliers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(20),
    phone VARCHAR(40),
    email VARCHAR(150),
    address VARCHAR(200),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PRODUCTOS
CREATE TABLE products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id),
    supplier_id BIGINT REFERENCES suppliers(id),
    name VARCHAR(160) NOT NULL,
    brand VARCHAR(100),
    barcode VARCHAR(80) UNIQUE,
    description TEXT,
    cost_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(cost_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. LISTAS DE PRECIOS
CREATE TABLE price_lists (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Los precios son generales para todas las sucursales.
CREATE TABLE product_prices (
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    price_list_id BIGINT REFERENCES price_lists(id),
    price NUMERIC(14,2) NOT NULL CHECK(price >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(product_id, price_list_id)
);

-- 10. INVENTARIO POR SUCURSAL
CREATE TABLE inventory (
    branch_id BIGINT REFERENCES branches(id),
    product_id BIGINT REFERENCES products(id),
    quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK(quantity >= 0),
    minimum_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK(minimum_quantity >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(branch_id, product_id)
);

-- 11. LOTES Y VENCIMIENTOS
CREATE TABLE inventory_batches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    purchase_item_id BIGINT,
    quantity_received NUMERIC(14,3) NOT NULL CHECK(quantity_received > 0),
    quantity_remaining NUMERIC(14,3) NOT NULL CHECK(quantity_remaining >= 0),
    unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(unit_cost >= 0),
    expiration_date DATE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK(quantity_remaining <= quantity_received)
);

CREATE INDEX idx_inventory_batches_product_expiration
ON inventory_batches(branch_id, product_id, expiration_date);

-- 12. CLIENTES
CREATE TABLE customers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(140) NOT NULL,
    phone VARCHAR(40),
    email VARCHAR(150),
    tax_id VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. MÉTODOS DE PAGO
CREATE TABLE payment_methods (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 14. VENTAS
CREATE TABLE sales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    cash_register_id BIGINT NOT NULL,
    cash_session_id BIGINT NOT NULL REFERENCES cash_sessions(id),
    customer_id BIGINT REFERENCES customers(id),
    employee_id BIGINT NOT NULL REFERENCES users(id),
    sale_number BIGINT NOT NULL,
    sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    price_list_id BIGINT REFERENCES price_lists(id),
    subtotal NUMERIC(14,2) NOT NULL CHECK(subtotal >= 0),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(discount_amount >= 0),
    total NUMERIC(14,2) NOT NULL CHECK(total >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
        CHECK(status IN ('COMPLETED', 'CANCELLED', 'RETURNED')),
    receipt_type VARCHAR(20) NOT NULL DEFAULT 'INTERNAL'
        CHECK(receipt_type IN ('INTERNAL', 'FISCAL')),
    fiscal_reference VARCHAR(100),
    UNIQUE(branch_id, sale_number),
    FOREIGN KEY(cash_register_id, branch_id)
        REFERENCES cash_registers(id, branch_id)
);

CREATE TABLE sale_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity NUMERIC(14,3) NOT NULL CHECK(quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK(unit_price >= 0),
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(discount_amount >= 0),
    line_total NUMERIC(14,2) NOT NULL CHECK(line_total >= 0)
);

CREATE TABLE sale_payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id),
    payment_method_id BIGINT NOT NULL REFERENCES payment_methods(id),
    amount NUMERIC(14,2) NOT NULL CHECK(amount > 0)
);

-- 15. PUNTOS DE CLIENTES
CREATE TABLE customer_points_ledger (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    sale_id BIGINT REFERENCES sales(id),
    points INTEGER NOT NULL,
    description VARCHAR(180),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. COMPRAS A PROVEEDORES
CREATE TABLE purchases (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    employee_id BIGINT NOT NULL REFERENCES users(id),
    invoice_number VARCHAR(80),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(total >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK(status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    notes TEXT
);

CREATE TABLE purchase_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity NUMERIC(14,3) NOT NULL CHECK(quantity > 0),
    unit_cost NUMERIC(14,2) NOT NULL CHECK(unit_cost >= 0),
    line_total NUMERIC(14,2) NOT NULL CHECK(line_total >= 0),
    expiration_date DATE
);

ALTER TABLE inventory_batches
ADD CONSTRAINT fk_inventory_batch_purchase_item
FOREIGN KEY(purchase_item_id) REFERENCES purchase_items(id);

-- 17. PEDIDOS DE CLIENTES
CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    customer_id BIGINT REFERENCES customers(id),
    employee_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_method VARCHAR(30),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK(status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED')),
    total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(total >= 0),
    notes TEXT
);

CREATE TABLE order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity NUMERIC(14,3) NOT NULL CHECK(quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK(unit_price >= 0),
    line_total NUMERIC(14,2) NOT NULL CHECK(line_total >= 0)
);

-- 18. TRASPASOS ENTRE SUCURSALES
CREATE TABLE stock_transfers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    origin_branch_id BIGINT NOT NULL REFERENCES branches(id),
    destination_branch_id BIGINT NOT NULL REFERENCES branches(id),
    requested_by BIGINT NOT NULL REFERENCES users(id),
    received_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK(status IN ('PENDING', 'SENT', 'RECEIVED', 'CANCELLED')),
    notes TEXT,
    CHECK(origin_branch_id <> destination_branch_id)
);

CREATE TABLE stock_transfer_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    transfer_id BIGINT NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity NUMERIC(14,3) NOT NULL CHECK(quantity > 0)
);

-- 19. MOVIMIENTOS DE CAJA
CREATE TABLE cash_movements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cash_session_id BIGINT NOT NULL REFERENCES cash_sessions(id),
    employee_id BIGINT NOT NULL REFERENCES users(id),
    movement_type VARCHAR(20) NOT NULL
        CHECK(movement_type IN ('INCOME', 'EXPENSE', 'OPENING', 'CLOSING', 'SALE')),
    description VARCHAR(200) NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK(amount >= 0),
    reference_type VARCHAR(40),
    reference_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. REGISTRO DE AUDITORÍA
CREATE TABLE audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    branch_id BIGINT REFERENCES branches(id),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(80) NOT NULL,
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. MOVIMIENTOS DE INVENTARIO
CREATE TABLE inventory_movements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    employee_id BIGINT REFERENCES users(id),
    movement_type VARCHAR(20) NOT NULL
        CHECK(movement_type IN ('SALE', 'PURCHASE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'RETURN')),
    quantity_change NUMERIC(14,3) NOT NULL CHECK(quantity_change <> 0),
    quantity_after NUMERIC(14,3) NOT NULL CHECK(quantity_after >= 0),
    reference_type VARCHAR(40),
    reference_id BIGINT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. ÍNDICES
CREATE INDEX idx_sales_sold_at ON sales(sold_at);
CREATE INDEX idx_sales_branch_date ON sales(branch_id, sold_at);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_cash_movements_session ON cash_movements(cash_session_id, created_at);
CREATE INDEX idx_purchases_branch_date ON purchases(branch_id, purchased_at);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_inventory_movements_product_date
ON inventory_movements(branch_id, product_id, created_at);

-- 23. HISTORIAL DE PROVEEDORES
CREATE OR REPLACE VIEW v_supplier_purchase_summary AS
SELECT
    s.id AS supplier_id,
    s.business_name AS supplier,
    COUNT(DISTINCT pu.id) AS number_of_purchases,
    COALESCE(SUM(pu.total), 0) AS total_spent,
    MAX(pu.purchased_at) AS last_purchase_at
FROM suppliers s
LEFT JOIN purchases pu
    ON pu.supplier_id = s.id
    AND pu.status = 'CONFIRMED'
GROUP BY s.id, s.business_name;

CREATE OR REPLACE VIEW v_supplier_product_entries AS
SELECT
    s.id AS supplier_id,
    s.business_name AS supplier,
    pu.id AS purchase_id,
    pu.invoice_number AS receipt_or_invoice_number,
    pu.purchased_at,
    b.name AS branch,
    p.id AS product_id,
    p.name AS product,
    pi.quantity,
    pi.unit_cost,
    pi.line_total,
    pi.expiration_date
FROM purchases pu
JOIN suppliers s ON s.id = pu.supplier_id
JOIN purchase_items pi ON pi.purchase_id = pu.id
JOIN products p ON p.id = pi.product_id
JOIN branches b ON b.id = pu.branch_id
WHERE pu.status = 'CONFIRMED';

-- 24. INVENTARIO CON CATEGORÍAS Y ESTADO DE STOCK
CREATE OR REPLACE VIEW v_inventory_by_category AS
SELECT
    i.branch_id,
    b.name AS branch,
    c.id AS category_id,
    c.name AS category,
    p.id AS product_id,
    p.name AS product,
    p.brand,
    p.barcode,
    i.quantity AS current_stock,
    i.minimum_quantity,
    CASE
        WHEN i.quantity <= 0 THEN 'SIN STOCK'
        WHEN i.quantity <= i.minimum_quantity THEN 'STOCK BAJO'
        ELSE 'DISPONIBLE'
    END AS stock_status,
    i.updated_at AS stock_updated_at
FROM inventory i
JOIN branches b ON b.id = i.branch_id
JOIN products p ON p.id = i.product_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = TRUE;

-- 25. DATOS INICIALES
INSERT INTO roles(name, description) VALUES
('DUENO', 'Acceso general a todas las sucursales y funciones'),
('ENCARGADO', 'Administra operaciones autorizadas de una sucursal'),
('CAJERO', 'Realiza ventas y operaciones de caja autorizadas'),
('DEPOSITO', 'Gestiona inventario y movimientos de stock')
ON CONFLICT(name) DO NOTHING;

INSERT INTO permissions(code, description) VALUES
('sales.create', 'Registrar ventas'),
('sales.cancel', 'Cancelar ventas'),
('sales.discount', 'Aplicar descuentos'),
('prices.view', 'Consultar precios'),
('prices.edit', 'Modificar precios'),
('products.manage', 'Crear y editar productos'),
('inventory.view', 'Consultar stock'),
('inventory.adjust', 'Ajustar stock'),
('purchases.manage', 'Registrar compras'),
('transfers.manage', 'Gestionar traspasos'),
('cash.open', 'Abrir cajas'),
('cash.close', 'Cerrar cajas'),
('cash.movements', 'Registrar ingresos y egresos de caja'),
('reports.view', 'Consultar informes'),
('users.manage', 'Gestionar usuarios y permisos'),
('branches.manage', 'Gestionar sucursales')
ON CONFLICT(code) DO NOTHING;

INSERT INTO price_lists(name, description) VALUES
('Lista 1', 'Primera lista de precios de venta'),
('Lista 2', 'Segunda lista de precios de venta')
ON CONFLICT(name) DO NOTHING;

INSERT INTO payment_methods(name) VALUES
('Efectivo'),
('Débito'),
('Crédito'),
('Transferencia')
ON CONFLICT(name) DO NOTHING;

COMMIT;

-- =========================================================
-- REGLAS IMPORTANTES PARA EL BACKEND
-- =========================================================
-- 1. Lista 1 y Lista 2 son iguales en todas las sucursales.
-- 2. El costo de compra se guarda por compra y por lote.
-- 3. Cada compra confirmada debe aumentar el inventario y crear sus lotes.
-- 4. Cada venta debe descontar inventario y lotes.
-- 5. Para vender, priorizar el lote que vence primero.
-- 6. Compras, ventas y movimientos deben guardarse en transacciones.
-- 7. Los cierres diarios no borran ventas, compras ni movimientos históricos.
-- 8. Las contraseñas se guardan como hash desde Node.js, nunca en texto plano.
-- 9. La facturación fiscal necesita integración real con ARCA.