import express from 'express';
import { criarPrevisao, obterPrevisoes, obterPrevisaoPorId, atualizarPrevisao, apagarPrevisao } from '../controllers/previsao_meteorologica.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'analista_risco');

// GET /previsoes?idarea_risco=1&confianca_minima=0.8&page=1&limit=20
router.get('/',    obterPrevisoes);
router.get('/:id', obterPrevisaoPorId);
router.post('/', criarPrevisao);
router.patch('/:id', verifyToken, writeRoles, atualizarPrevisao);
router.delete('/:id', verifyToken, writeRoles, apagarPrevisao);

export default router;
