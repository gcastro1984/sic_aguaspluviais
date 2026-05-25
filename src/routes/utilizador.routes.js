import express from 'express';
import { login, criarUtilizador, obterUtilizador, obterUtilizadores, apagarUtilizador } from '../controllers/utilizador.controller.js';
import { verifyToken, requireAdmin, requireSelfOrAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ── Rotas públicas ──────────────────────────────────────────
// POST /login  – autenticação (devolve JWT)
router.post('/login', login);

// ── Rotas protegidas ────────────────────────────────────────
// POST /utilizadores  – criar utilizador (apenas admin)
router.post('/', verifyToken, requireAdmin, criarUtilizador);

// GET /utilizadores  – listar todos (apenas admin)
router.get('/', verifyToken, requireAdmin, obterUtilizadores);

// GET /utilizadores/:id  – ver dados (admin ou próprio utilizador)
router.get('/:id', verifyToken, requireSelfOrAdmin, obterUtilizador);

// DELETE /utilizadores/:id  – apagar (apenas admin)
router.delete('/:id', verifyToken, requireAdmin, apagarUtilizador);

export default router;