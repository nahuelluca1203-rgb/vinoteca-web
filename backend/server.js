const express = require("express");
const path = require("path");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

// Conectar rutas de productos
const productsRoutes = require("./routes/products");

app.use(helmet({
    contentSecurityPolicy: false
}));

app.use(express.json());

// API de productos
app.use("/api/productos", productsRoutes);

// Conectar frontend
const frontendPath = path.join(__dirname, "../frontend");

app.use(express.static(frontendPath));

// Página principal
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// API principal
app.get("/api", (req, res) => {
    res.json({
        sistema: "EIKVOR",
        estado: "Funcionando correctamente"
    });
});

// Puerto
const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("EIKVOR INICIADO");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("--------------------------------");
});
