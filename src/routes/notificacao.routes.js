import express from 'express';
import {
    criarNotificacao,
    obterNotificacoes,
    obterNotificacaoPorId,
    atualizarNotificacao,
    apagarNotificacao
} from '../controllers/notificacao.controller.js';

const router = express.Router();

router.post('/', criarNotificacao);
router.get('/', obterNotificacoes);
router.get('/:id', obterNotificacaoPorId);
router.put('/:id', atualizarNotificacao);
router.delete('/:id', apagarNotificacao);

export default router;
