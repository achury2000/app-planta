// backend/src/index.js
require("dotenv").config();
console.log("MONGO_URI:", process.env.MONGO_URI);
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const activityRoutes = require("./routes/activity.routes");
const achievementsRoutes = require("./routes/achievements.routes");
const authRoutes = require("./routes/auth.routes");
const contentRoutes = require("./routes/content.routes");
const adminRoutes = require("./routes/admin.routes");
const orqRoutes = require("./routes/orq.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
const PORT = process.env.PORT || 5000;

/* ── Middlewares ── */
app.use(cors());
app.use(express.json());

/* ── Rutas ── */
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/achievements", achievementsRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orq", orqRoutes);
app.use("/api/user", userRoutes);

/* ── Ruta raíz ── */
app.get("/", (_req, res) => {
  res.json({ nombre: "Planta de Transformación API", docs: "/api/health" });
});

/* ── Health check ── */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ── Conexión a MongoDB y arranque ── */
connectDB().then(() => {
  // app.listen(PORT, () => {
  //   console.log(`Backend corriendo en http://localhost:${PORT}`);
  // });

  app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend corriendo en http://0.0.0.0:${PORT}`);
  console.log("BOOT: backend/src/index.js LOADED");
});

});
