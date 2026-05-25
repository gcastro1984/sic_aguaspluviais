import express from 'express';
import * as SensoresController from '../controllers/sensor.contoller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

router.get('/',    SensoresController.getAllSensors);
router.get('/:id', SensoresController.getSensorById);
router.post('/',   verifyToken, writeRoles, SensoresController.createNewSensor);
router.patch('/:id', verifyToken, writeRoles, SensoresController.atualizarSensor);
router.delete('/:id', verifyToken, writeRoles, SensoresController.deletarSensor);

export default router;
