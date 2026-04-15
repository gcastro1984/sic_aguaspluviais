


// Importar os dados dos utilizadores
import { users } from '../models/users.model.js';



export const login = (req, res) => {
    // 1. Extrair credenciais do corpo do pedido (req.body)
    const { email, password } = req.body;
    console.log( req.body);
    console.log('HEADERS:', req.headers['content-type'])

    // 2. Validar se os campos obrigatórios foram enviados

    if (!email || !password) {
        return res.status(400).json({ error: "invalid_request", description: "Email and password are mandatory." }); 
    }

    // 3. Procurar o utilizador na "base de dados" 
    const user = users.find(u => u.email === email);

    // 4. Verificar credenciais

    if (!user || user.password !== password) {
        // Enviar 401 se as credenciais forem inválidas 
        return res.status(401).json({ 
            error: "no_credentials", 
            error_description: "Invalid email or password." 
        });
    }

    // 5. Sucesso: Enviar resposta 200 OK com os dados/token 

    res.status(200).json({
        message: "Login successful",
        userId: user.id,
        token: "exemplo-de-jwt-token" 
    });
};