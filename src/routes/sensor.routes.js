import express from 'express';
import * as SensoresController from '../controllers/sensor.contoller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles     = requireRole('administrador', 'operador_municipal');
const calibracaoRole = requireRole('administrador', 'operador_municipal'); // operador é quem calibra

router.get('/',    SensoresController.getAllSensors);
router.get('/:id', SensoresController.getSensorById);
router.post('/',   verifyToken, writeRoles, SensoresController.createNewSensor);
router.patch('/:id', verifyToken, writeRoles, SensoresController.atualizarSensor);
router.delete('/:id', verifyToken, writeRoles, SensoresController.deletarSensor);

// Acção controller: o operador_municipal regista a calibração e notifica os responsáveis
router.post('/:id/calibracao', verifyToken, calibracaoRole, SensoresController.notificarCalibracao);

export default router;
