import express from 'express';
import { obterAlertas, obterAlertaPorId, atualizarAlerta, apagarAlerta } from '../controllers/alerta.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

// GET /alertas?estado=ativo&page=1&limit=20
router.get('/',    obterAlertas);
router.get('/:id', obterAlertaPorId);
router.patch('/:id', verifyToken, writeRoles, atualizarAlerta);
router.delete('/:id', verifyToken, writeRoles, apagarAlerta);

export default router;
