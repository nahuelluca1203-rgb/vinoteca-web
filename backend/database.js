const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Crear la carpeta Database si no existe
const databaseFolder = path.join(__dirname, "../Database");

if (!fs.existsSync(databaseFolder)) {
    fs.mkdirSync(databaseFolder, { recursive: true });
}

// Crear o abrir la base de datos
const dbPath = path.join(databaseFolder, "eikvor.db");
const db = new Database(dbPath);

// Configuración de SQLite
db.pragma("foreign_keys = ON");

// CREACIÓN DE TABLAS
db.exec(`

    -- CATEGORÍAS
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        active INTEGER DEFAULT 1
    );

    -- PROVEEDORES
    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        active INTEGER DEFAULT 1
    );

    -- PRODUCTOS
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        supplier_id INTEGER,
        cost REAL DEFAULT 0,
        sale_price REAL DEFAULT 0,
        min_stock REAL DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- INVENTARIO
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL UNIQUE,
        quantity REAL DEFAULT 0,

        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- MOVIMIENTOS DE INVENTARIO
    CREATE TABLE IF NOT EXISTS inventory_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (product_id) REFERENCES products(id)
    );

`);

console.log("--------------------------------");
console.log("EIKVOR - BASE DE DATOS");
console.log("Conexión correcta");
console.log("Tablas iniciales creadas");
console.log("--------------------------------");

module.exports = db;