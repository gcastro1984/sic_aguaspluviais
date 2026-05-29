import express from 'express';
import * as SensoresController from '../controllers/sensor.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles     = requireRole('administrador', 'operador_municipal');
const calibracaoRole = requireRole('administrador', 'operador_municipal');

router.get('/',    SensoresController.obterSensores);
router.get('/:id', SensoresController.obterSensorPorId);
router.post('/',   verifyToken, writeRoles, SensoresController.criarSensor);
router.put('/:id',    verifyToken, writeRoles, SensoresController.substituirSensor);
router.patch('/:id',  verifyToken, writeRoles, SensoresController.atualizarSensor);
router.delete('/:id', verifyToken, writeRoles, SensoresController.apagarSensor);

// Acção controller: o operador_municipal regista a calibração e notifica os responsáveis
router.post('/:id/calibracao', verifyToken, calibracaoRole, SensoresController.notificarCalibracao);

export default router;
