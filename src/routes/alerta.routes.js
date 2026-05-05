import express from 'express';

// import controllers for products resource
import { criarAlerta } from '../controllers/alerta.controller.js';    

const router = express.Router();

router.post('/', criarAlerta);



export default router;
