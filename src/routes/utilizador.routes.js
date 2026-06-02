import express from 'express';
import { login, refresh, logout, criarUtilizador, obterUtilizador, obterUtilizadores, editarUtilizador, apagarUtilizador } from '../controllers/utilizador.controller.js';
import { verifyToken, requireAdmin, requireSelfOrAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ── Rotas públicas ──────────────────────────────────────────
router.post('/login',   login);
router.post('/refresh', refresh);

// ── Rotas protegidas ────────────────────────────────────────
router.post('/logout',  verifyToken, logout);

// ── Rotas protegidas (restantes) ────────────────────────────
// POST /utilizadores  – criar utilizador (apenas admin)
router.post('/', verifyToken, requireAdmin, criarUtilizador);

// GET /utilizadores  – listar todos (apenas admin)
router.get('/', verifyToken, requireAdmin, obterUtilizadores);

// GET /utilizadores/:id  – ver dados (admin ou próprio utilizador)
router.get('/:id', verifyToken, requireSelfOrAdmin, obterUtilizador);

// PATCH /utilizadores/:id  – editar (admin ou próprio utilizador)
router.patch('/:id', verifyToken, requireSelfOrAdmin, editarUtilizador);

// DELETE /utilizadores/:id  – apagar (apenas admin)
router.delete('/:id', verifyToken, requireAdmin, apagarUtilizador);

export default router;