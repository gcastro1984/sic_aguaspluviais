


// Importar os dados dos utilizadores

import Utilizador from '../models/utilizador.model.js';

export const login = async (req, res) => {
  try {
    // 1. Extrair dados
    const { email, password } = req.body;

    console.log(req.body);
    console.log('HEADERS:', req.headers['content-type']);

    // 2. Validar dados
    if (!email || !password) {
      return res.status(400).json({
        error: "invalid_request",
        description: "Email and password are mandatory."
      });
    }

    // ✅ 3. Procurar utilizador na base de dados
    const user = await Utilizador.findOne({
      where: { email }
    });

    // 4. Verificar se existe
    if (!user) {
      return res.status(401).json({
        error: "no_credentials",
        error_description: "Invalid email or password."
      });
    }

    //  Verificar password (versão simples)
    if (user.password_hash !== password) {
      return res.status(401).json({
        error: "no_credentials",
        error_description: "Invalid email or password."
      });
    }

    //  Sucesso
    res.status(200).json({
      message: "Login successful",
      userId: user.idutilizador,
      token: "exemplo-de-jwt-token"
    });
    
} catch (error) {
    console.error(error);
    res.status(500).json({
      error: "server_error",
      description: error.message
    });
  }
};

