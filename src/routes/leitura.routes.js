import express from 'express';
import { obterLeituras, criarLeitura, obterLeituraPorId, apagarLeitura, obterLeiturasPorSensor } from '../controllers/leitura.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

router.get('/',                    obterLeituras);
router.post('/',                   criarLeitura);
router.get('/sensor/:idsensor',    obterLeiturasPorSensor);
router.get('/:id',                 obterLeituraPorId);
router.delete('/:id',              apagarLeitura);

export default router;
