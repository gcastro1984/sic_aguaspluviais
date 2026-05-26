import express from 'express';
import { obterLeituras, criarLeitura } from '../controllers/leitura.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

router.get('/',  obterLeituras);
router.post('/', criarLeitura);

export default router;
