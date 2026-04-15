import express from 'express';

const router = express.Router();


import { login } from '../controllers/utilizador.controller.js';



router.post('/login', login)



export default router;