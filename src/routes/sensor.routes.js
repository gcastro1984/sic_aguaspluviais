import express from 'express';
import * as SensoresController from '../controllers/sensor.controller.js';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

const writeRoles = requireRole('administrador', 'operador_municipal');

router.get('/',verifyToken, SensoresController.obterSensores);
router.get('/:id',                 verifyToken, SensoresController.obterSensorPorId);
router.post('/',                   verifyToken, writeRoles, SensoresController.criarSensor);
router.post('/:id/calibracao',     verifyToken, writeRoles, SensoresController.registarCalibracao);
router.patch('/:id',               verifyToken, writeRoles, SensoresController.atualizarSensor);
router.delete('/:id',              verifyToken, writeRoles, SensoresController.apagarSensor);

export default router;
