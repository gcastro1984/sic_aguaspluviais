import express from 'express';
import { obterRelatorios, obterRelatorioPorId, atualizarRelatorio, apagarRelatorio } from '../controllers/relatorio.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

// GET /relatorios?idutilizador=1&idalerta=2&page=1&limit=20
router.get('/',     obterRelatorios);
router.get('/:id',  obterRelatorioPorId);
router.patch('/:id',  verifyToken, writeRoles, atualizarRelatorio);
router.delete('/:id', verifyToken, writeRoles, apagarRelatorio);

export default router;
