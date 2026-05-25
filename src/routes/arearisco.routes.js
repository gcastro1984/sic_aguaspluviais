import express from 'express';

// import controllers for area de risco resource
import { 
    criarAreaRisco, 
    obterAreasRisco, 
    obterAreaRiscoPorId, 
    atualizarAreaRisco, 
    deletarAreaRisco,
    obterAreasPorVulnerabilidade 
} from '../controllers/arearisco.controller.js';    

const router = express.Router();

// POST - Create a new area de risco
router.post('/', criarAreaRisco);

// GET - Get all areas de risco
router.get('/', obterAreasRisco);

// GET - Get area de risco by ID
router.get('/:id', obterAreaRiscoPorId);

// GET - Get areas by vulnerability level
router.get('/vulnerabilidade/:nivel', obterAreasPorVulnerabilidade); /////NOT 

// PUT - Update an area de risco
router.put('/:id', atualizarAreaRisco);

// DELETE - Delete an area de risco
router.delete('/:id', deletarAreaRisco);

export default router;
