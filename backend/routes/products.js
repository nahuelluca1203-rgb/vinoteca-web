const express = require("express");
const router = express.Router();
const db = require("../database");

// CONSULTAR TODOS LOS PRODUCTOS
router.get("/", (req, res) => {
    try {
        const products = db.prepare(`
            SELECT
                products.*,
                categories.name AS category_name,
                suppliers.name AS supplier_name,
                COALESCE(inventory.quantity, 0) AS stock
            FROM products
            LEFT JOIN categories ON products.category_id = categories.id
            LEFT JOIN suppliers ON products.supplier_id = suppliers.id
            LEFT JOIN inventory ON products.id = inventory.product_id
            WHERE products.active = 1
            ORDER BY products.name ASC
        `).all();

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Error al consultar productos" });
    }
});

// AGREGAR PRODUCTO
router.post("/", (req, res) => {
    try {
        const {
            code,
            name,
            description,
            category_id,
            supplier_id,
            cost,
            sale_price,
            min_stock,
            quantity
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "El nombre del producto es obligatorio"
            });
        }

        const createProduct = db.transaction(() => {
            const result = db.prepare(`
                INSERT INTO products (
                    code, name, description, category_id,
                    supplier_id, cost, sale_price, min_stock
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                code || null,
                name.trim(),
                description || null,
                category_id || null,
                supplier_id || null,
                Number(cost) || 0,
                Number(sale_price) || 0,
                Number(min_stock) || 0
            );

            db.prepare(`
                INSERT INTO inventory (product_id, quantity)
                VALUES (?, ?)
            `).run(result.lastInsertRowid, Number(quantity) || 0);

            return result.lastInsertRowid;
        });

        const productId = createProduct();

        res.status(201).json({
            message: "Producto agregado correctamente",
            id: productId
        });

    } catch (error) {
        res.status(400).json({
            error: "No se pudo agregar el producto. Revisá los datos y el código."
        });
    }
});

// MODIFICAR PRODUCTO
router.put("/:id", (req, res) => {
    try {
        const {
            code,
            name,
            description,
            category_id,
            supplier_id,
            cost,
            sale_price,
            min_stock
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "El nombre del producto es obligatorio"
            });
        }

        const result = db.prepare(`
            UPDATE products
            SET
                code = ?,
                name = ?,
                description = ?,
                category_id = ?,
                supplier_id = ?,
                cost = ?,
                sale_price = ?,
                min_stock = ?
            WHERE id = ? AND active = 1
        `).run(
            code || null,
            name.trim(),
            description || null,
            category_id || null,
            supplier_id || null,
            Number(cost) || 0,
            Number(sale_price) || 0,
            Number(min_stock) || 0,
            req.params.id
        );

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.json({ message: "Producto actualizado correctamente" });

    } catch (error) {
        res.status(400).json({
            error: "No se pudo modificar el producto"
        });
    }
});

// ELIMINAR PRODUCTO (DESACTIVAR)
router.delete("/:id", (req, res) => {
    try {
        const result = db.prepare(`
            UPDATE products
            SET active = 0
            WHERE id = ?
        `).run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.json({ message: "Producto eliminado correctamente" });

    } catch (error) {
        res.status(500).json({
            error: "No se pudo eliminar el producto"
        });
    }
});

module.exports = router;
