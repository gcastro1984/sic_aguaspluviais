import express from 'express';
import { criarAlertaPlanoAcao, obterAlertasPlanos, obterAlertaPlanoAcaoPorIds, atualizarAlertaPlanoAcao, apagarAlertaPlanoAcao } from '../controllers/alerta_plano_acao.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

// GET /alertas-planos?estado=X&idalerta=1&idplano_acao=2&page=1&limit=20

router.get('/', obterAlertasPlanos);
router.get('/:idalerta/:idplano_acao', verifyToken, obterAlertaPlanoAcaoPorIds);
router.post('/',   verifyToken, writeRoles, criarAlertaPlanoAcao);
router.patch('/:idalerta/:idplano_acao', verifyToken, writeRoles, atualizarAlertaPlanoAcao);
router.delete('/:idalerta/:idplano_acao', verifyToken, writeRoles, apagarAlertaPlanoAcao);

export default router;
