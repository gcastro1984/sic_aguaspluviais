import express from 'express';
const router = express.Router();





import * as SensoresController from '../controllers/sensor.contoller.js';

router.post('/sensores', SensoresController.createNewSensor);

router.put('/:id/status', SensoresController.updateStatusSensor);
router.get('/sensores', SensoresController.getAllSensors);





export default router;