import express from 'express';
import { criarNotificacao, obterNotificacoes, obterNotificacaoPorId, atualizarNotificacao, apagarNotificacao } from '../controllers/notificacao.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

router.get('/',    verifyToken, obterNotificacoes);
router.get('/:id', verifyToken, obterNotificacaoPorId);
router.post('/',   verifyToken, writeRoles, criarNotificacao);
router.patch('/:id', verifyToken, writeRoles, atualizarNotificacao);
router.delete('/:id', verifyToken, writeRoles, apagarNotificacao);

export default router;
