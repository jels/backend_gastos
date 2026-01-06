const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "gastos.json");

// CORS configurado para permitir tu dominio de Netlify
const corsOptions = {
  origin: [
    "http://localhost:4200",
    "https://tu-app.netlify.app", // Cambiar después del deploy
    /\.netlify\.app$/, // Permitir todos los subdominios de netlify
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Asegurar que existe el archivo de datos
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Control de Gastos API",
    timestamp: new Date().toISOString(),
  });
});

// GET - Obtener todos los gastos
app.get("/api/gastos", async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    const gastos = JSON.parse(data);
    res.json(gastos);
  } catch (error) {
    console.error("Error al leer gastos:", error);
    res.status(500).json({ error: "Error al leer datos" });
  }
});

// POST - Agregar un gasto
app.post("/api/gastos", async (req, res) => {
  try {
    const nuevoGasto = req.body;
    const data = await fs.readFile(DATA_FILE, "utf8");
    const gastos = JSON.parse(data);

    gastos.push(nuevoGasto);

    await fs.writeFile(DATA_FILE, JSON.stringify(gastos, null, 2));
    res.json(nuevoGasto);
  } catch (error) {
    console.error("Error al guardar gasto:", error);
    res.status(500).json({ error: "Error al guardar datos" });
  }
});

// DELETE - Eliminar todos los gastos
app.delete("/api/gastos", async (req, res) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
    res.json({ message: "Todos los gastos eliminados" });
  } catch (error) {
    console.error("Error al eliminar gastos:", error);
    res.status(500).json({ error: "Error al eliminar datos" });
  }
});

// PUT - Actualizar todos los gastos (para importar)
app.put("/api/gastos", async (req, res) => {
  try {
    const gastos = req.body;
    await fs.writeFile(DATA_FILE, JSON.stringify(gastos, null, 2));
    res.json({
      message: "Datos importados correctamente",
      count: gastos.length,
    });
  } catch (error) {
    console.error("Error al importar gastos:", error);
    res.status(500).json({ error: "Error al importar datos" });
  }
});

// Iniciar servidor
ensureDataFile().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log(`📁 Archivo de datos: ${DATA_FILE}`);
  });
});
