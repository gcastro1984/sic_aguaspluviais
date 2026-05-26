import express from 'express';
import { criarPlanoAcao, obterPlanosAcao, obterPlanoAcaoPorId, substituirPlanoAcao, atualizarPlanoAcao, apagarPlanoAcao } from '../controllers/plano_acao.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

router.get('/',    obterPlanosAcao);
router.get('/:id', obterPlanoAcaoPorId);
router.post('/',   verifyToken, writeRoles, criarPlanoAcao);
router.put('/:id',   verifyToken, writeRoles, substituirPlanoAcao);
router.patch('/:id', verifyToken, writeRoles, atualizarPlanoAcao);
router.delete('/:id', verifyToken, writeRoles, apagarPlanoAcao);

export default router;
