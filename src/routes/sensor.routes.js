import express from 'express';
const router = express.Router();





import * as SensoresController from '../controllers/sensor.controller.js';

router.post('/sensores', SensoresController.createNewSensor);

router.put('/:id/status', SensoresController.updateStatus);





export default router;