import express from 'express';
import {
    criarDestinatario,
    obterDestinatarios,
    obterDestinatarioPorId,
    atualizarDestinatario,
    apagarDestinatario
} from '../controllers/destinatarios.controller.js';

const router = express.Router();

router.post('/', criarDestinatario);
router.get('/', obterDestinatarios);
router.get('/:id', obterDestinatarioPorId);
router.put('/:id', atualizarDestinatario);
router.delete('/:id', apagarDestinatario);

export default router;
