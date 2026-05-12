import express from 'express';

// import controllers for infraestrutura urbana resource
import {
    criarInfraestruturaUrbana,
    obterInfraestruturas,
    obterInfraestruturaUrbanaId,
    atualizarInfraestruturaUrbana,
    deletarInfraestruturaUrbana,
    obterInfraestruturasPorArea,
    obterInfraestruturasPorTipo
} from '../controllers/infraestrutura.controller.js';

const router = express.Router();

// POST - Create a new infraestrutura urbana
router.post('/', criarInfraestruturaUrbana);

// GET - Get all infraestruturas urbanas
router.get('/', obterInfraestruturas);

// GET - Get infraestrutura urbana by ID
router.get('/:id', obterInfraestruturaUrbanaId);

// GET - Get infraestruturas by area de risco
router.get('/area/:idarea_risco', obterInfraestruturasPorArea);

// GET - Get infraestruturas by tipo
router.get('/tipo/:tipo', obterInfraestruturasPorTipo);

// PUT - Update an infraestrutura urbana
router.put('/:id', atualizarInfraestruturaUrbana);

// DELETE - Delete an infraestrutura urbana
router.delete('/:id', deletarInfraestruturaUrbana);

export default router;
