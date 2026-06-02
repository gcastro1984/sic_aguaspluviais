import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import utilizadorRoutes from './src/routes/utilizador.routes.js';
import sensorRoutes from './src/routes/sensor.routes.js';
import alertasRoutes from './src/routes/alerta.routes.js';
import leiturasRoutes from './src/routes/leitura.routes.js';
import areasRiscoRoutes from './src/routes/arearisco.routes.js';
import infraestruturaRoutes from './src/routes/infraestrutura.routes.js';
import previsaoMeteorologicaRoutes from './src/routes/previsao_metereologica.routes.js';
import alertaPlanoAcaoRoutes from './src/routes/alerta_plano_acao.routes.js';
import planoAcaoRoutes from './src/routes/plano_acao.routes.js';
import destinatariosRoutes from './src/routes/destinatarios.routes.js';
import notificacaoRoutes from './src/routes/notificacao.routes.js';
import relatorioRoutes from './src/routes/relatorio.routes.js';
import planoAlertaRoutes from './src/routes/plano_alerta.routes.js';

const app = express();
const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3001;

// CORS — aceita apenas a origem do frontend definida no .env
// credentials:true é obrigatório para o browser enviar o cookie httpOnly do refresh token
app.use(cors({
    origin:         process.env.FRONTEND_URL,
    methods:        ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:    true
}));

// depois JSON e cookies
app.use(express.json());
app.use(cookieParser());

// rotas
app.use('/utilizadores', utilizadorRoutes);
app.use('/sensores', sensorRoutes);
app.use('/alertas', alertasRoutes);
app.use('/leituras', leiturasRoutes);
app.use('/areas-risco', areasRiscoRoutes);
app.use('/infraestruturas', infraestruturaRoutes);
app.use('/previsoes', previsaoMeteorologicaRoutes);
app.use('/alertas-planos', alertaPlanoAcaoRoutes);
app.use('/planos-acao', planoAcaoRoutes);
app.use('/destinatarios', destinatariosRoutes);
app.use('/notificacoes', notificacaoRoutes);
app.use('/relatorios', relatorioRoutes);
app.use('/planos-alerta', planoAlertaRoutes);

// erro global — formato: { error, error_description, errors? }
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const payload = {
        error:             err.code    || 'internal_error',
        error_description: err.message || 'Internal Server Error'
    };

    if (err.errors) {
        payload.errors = err.errors;
    }

    res.status(status).json(payload);
});

// start
app.listen(port, host, () => {

    console.log(`Server running on http://${host}:${port}/`);

});