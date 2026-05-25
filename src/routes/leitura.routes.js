import express from 'express';
import { criarLeitura } from '../controllers/leitura.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', verifyToken, requireRole('administrador', 'operador_municipal'), criarLeitura);

export default router;
