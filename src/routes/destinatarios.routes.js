import express from 'express';
import { criarDestinatario, obterDestinatarios, obterDestinatarioPorId, atualizarDestinatario, apagarDestinatario } from '../controllers/destinatarios.controller.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/',    verifyToken, obterDestinatarios);
router.get('/:id', verifyToken, obterDestinatarioPorId);
router.post('/',   verifyToken, requireAdmin, criarDestinatario);
router.patch('/:id', verifyToken, requireAdmin, atualizarDestinatario);
router.delete('/:id', verifyToken, requireAdmin, apagarDestinatario);

export default router;
