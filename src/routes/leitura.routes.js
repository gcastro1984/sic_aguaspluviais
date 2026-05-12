import express from 'express';

// import controllers for products resource
import { criarLeitura } from '../controllers/leitura.controller.js';    

const router = express.Router();


router.post('/', criarLeitura);



export default router;