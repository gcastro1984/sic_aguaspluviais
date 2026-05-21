import express from 'express';
const router = express.Router();





import * as SensoresController from '../controllers/sensor.contoller.js';

router.post('/', SensoresController.createNewSensor);
router.get('/:id', SensoresController.getSensorById);
router.put('/:id/status', SensoresController.updateStatusSensor);
router.get('/', SensoresController.getAllSensors);





export default router;