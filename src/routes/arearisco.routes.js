import express from 'express';
import { criarAreaRisco, obterAreasRisco, obterAreaRiscoPorId, atualizarAreaRisco, deletarAreaRisco } from '../controllers/arearisco.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

// GET /areas-risco?vulnerabilidade=3&page=1&limit=20
router.get('/',    obterAreasRisco);
router.get('/:id', obterAreaRiscoPorId);
router.post('/',   verifyToken, writeRoles, criarAreaRisco);
router.patch('/:id', verifyToken, writeRoles, atualizarAreaRisco);
router.delete('/:id', verifyToken, writeRoles, deletarAreaRisco);

export default router;
