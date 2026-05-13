import express from 'express';
import {
    criarAlertaPlanoAcao,
    obterAlertasPlanos,
    obterPorIdAlerta,
    obterPorIdPlano,
    obterPorEstado,
    atualizarAlertaPlanoAcao,
    deletarAlertaPlanoAcao
} from '../controllers/alerta_plano_acao.controller.js';

const router = express.Router();

// POST - Criar novo alerta plano ação
router.post('/', criarAlertaPlanoAcao);

// GET - Obter todos os alertas planos ação
router.get('/', obterAlertasPlanos);

// GET - Obter alertas planos por estado
router.get('/estado/:estado', obterPorEstado);

// GET - Obter alertas planos por ID de alerta
router.get('/alerta/:idalerta', obterPorIdAlerta);

// GET - Obter alertas planos por ID de plano
router.get('/plano/:idplano_acao', obterPorIdPlano);

// PUT - Atualizar alerta plano ação
router.put('/:idalerta/:idplano_acao', atualizarAlertaPlanoAcao);

// DELETE - Deletar alerta plano ação
router.delete('/:idalerta/:idplano_acao', deletarAlertaPlanoAcao);

export default router;
