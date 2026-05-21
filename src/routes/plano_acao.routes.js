import express from 'express';
import { criarPlanoAcao, obterPlanosAcao, obterPlanoAcaoPorId, atualizarPlanoAcao, apagarPlanoAcao } from '../controllers/plano_acao.controller.js';

const router = express.Router();

router.post('/', criarPlanoAcao);
router.get('/', obterPlanosAcao);
router.get('/:id', obterPlanoAcaoPorId);
router.put('/:id', atualizarPlanoAcao);
router.delete('/:id', apagarPlanoAcao);

export default router;
