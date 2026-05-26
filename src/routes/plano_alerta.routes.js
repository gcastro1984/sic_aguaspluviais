import express from 'express';
import { criarPlanoAlerta, obterPlanosAlerta, obterPlanoAlertaPorIds, apagarPlanoAlerta } from '../controllers/plano_alerta.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

// GET /planos-alerta?idnivel_alerta=2&idplano_acao=1&page=1&limit=20
router.get('/',obterPlanosAlerta);
router.get('/:idplano_acao/:idnivel_alerta',   verifyToken, obterPlanoAlertaPorIds);
router.post('/',                               verifyToken, writeRoles, criarPlanoAlerta);
router.delete('/:idplano_acao/:idnivel_alerta', verifyToken, writeRoles, apagarPlanoAlerta);

export default router;
