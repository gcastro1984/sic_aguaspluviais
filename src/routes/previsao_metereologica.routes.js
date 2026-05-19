import express from 'express';
import {
    criarPrevisao,
    obterPrevisoes,
    obterPrevisaoPorId,
    atualizarPrevisao,
    apagarPrevisao,
    obterPrevisoesPorArea,
    obterPrevisoesPorConfianca
} from '../controllers/previsao_meteorologica.controller.js';

const router = express.Router();

// POST - Criar nova previsão meteorológica
router.post('/', criarPrevisao);

// GET - Obter todas as previsões
router.get('/', obterPrevisoes);

// GET - Obter previsão por ID
router.get('/:id', obterPrevisaoPorId);

// GET - Obter previsões por área
router.get('/area/:idarea_risco', obterPrevisoesPorArea);

// GET - Obter previsões por confiança mínima
router.get('/confianca/:confianca_minima', obterPrevisoesPorConfianca);

// PUT - Atualizar previsão
router.put('/:id', atualizarPrevisao);

// DELETE - Deletar previsão
router.delete('/:id', apagarPrevisao);

export default router;
