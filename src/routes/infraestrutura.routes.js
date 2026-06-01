import express from 'express';
import { criarInfraestruturaUrbana, obterInfraestruturas, obterInfraestruturaUrbanaId, atualizarInfraestruturaUrbana, deletarInfraestruturaUrbana } from '../controllers/infraestrutura.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

// GET /infraestruturas?idarea_risco=1&tipo=X&page=1&limit=20

router.get('/',    obterInfraestruturas);
router.get('/:id', obterInfraestruturaUrbanaId);
router.post('/',   verifyToken, writeRoles, criarInfraestruturaUrbana);
router.patch('/:id', verifyToken, writeRoles, atualizarInfraestruturaUrbana);
router.delete('/:id', verifyToken, writeRoles, deletarInfraestruturaUrbana);

export default router;
