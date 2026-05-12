import express from 'express';

// import controllers for alerts resource
import {
    criarAlerta,
    obterAlertas,
    obterAlertaPorId,
    atualizarAlerta,
    deletarAlerta,
    obterAlertasPorEstado
} from '../controllers/alerta.controller.js';

const router = express.Router();

// POST - Create a new alert
router.post('/', criarAlerta);

// GET - Get all alerts
router.get('/', obterAlertas);

// GET - Get alert by ID
router.get('/:id', obterAlertaPorId);

// GET - Get alerts by estado
router.get('/estado/:estado', obterAlertasPorEstado);

// PUT - Update an alert
router.put('/:id', atualizarAlerta);

// DELETE - Delete an alert
router.delete('/:id', deletarAlerta);

export default router;
