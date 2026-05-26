import express from 'express';
import { criarDestinatario, obterDestinatarios, obterDestinatarioPorId, substituirDestinatario, atualizarDestinatario, apagarDestinatario } from '../controllers/destinatarios.controller.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', obterDestinatarios);
router.get('/:id', verifyToken, obterDestinatarioPorId);
router.post('/',   verifyToken, requireAdmin, criarDestinatario);
router.put('/:id',   verifyToken, requireAdmin, substituirDestinatario);
router.patch('/:id', verifyToken, requireAdmin, atualizarDestinatario);
router.delete('/:id', verifyToken, requireAdmin, apagarDestinatario);

export default router;
