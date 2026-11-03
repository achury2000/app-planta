const express = require("express");
const { register, login, getMe, updateMe, deleteMe } = require("../controllers/auth.controller");

const router = express.Router();

/* ── POST /api/auth/register ── */
router.post("/register", register);

/* ── POST /api/auth/login ── */
router.post("/login", login);

/* ── GET /api/auth/me ── */
router.get("/me", getMe);

/* ── PUT /api/auth/me ── Actualizar perfil */
router.put("/me", updateMe);

/* ── DELETE /api/auth/me ── Eliminar cuenta */
router.delete("/me", deleteMe);

module.exports = router;
