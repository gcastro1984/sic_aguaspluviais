import { Sensor, Utilizador, Notificacao, LeituraSensor } from '../models/db.config.js';
import { sequelizeValidationError, validationError, missingFieldsValidationError, notFoundError, genericError } from '../utils/error.utils.js';
import { enviarEmailCalibracao } from '../utils/email.utils.js';

// Tipos de sensor aceites no sistema
const TIPOS_SENSOR_VALIDOS = ['nivel_agua', 'precipitacao', 'caudal', 'temperatura', 'humidade'];

// Verifica se a data é válida e estritamente no futuro (não aceita hoje nem datas passadas)
function validarDataFutura(valor, campo) {
    const d = new Date(valor);
    if (isNaN(d.getTime())) return { [campo]: 'Data inválida' };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (d <= hoje) return { [campo]: `${campo} deve ser uma data futura` };
    return null;
}

// Links HATEOAS — acções disponíveis para um sensor específico
const sensorLinks = (id) => ({
    self:   { href: `/sensores/${id}`, method: 'GET' },
    update: { href: `/sensores/${id}`, method: 'PATCH' },
    delete: { href: `/sensores/${id}`, method: 'DELETE' }
});

// GET /sensores — lista todos os sensores com paginação
export const obterSensores = async (req, res, next) => {
    try {
        // Paginação: limit máx 100, page ou offset aceites como parâmetros
        //?limit= da query string. parseInt converte para inteiro, || 20 garante o valor padrão se não vier. Math.max(1, ...) impede valores ≤ 0. Math.min(100, ...) impede que o cliente peça mais de 100 registos de uma vez.

        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));  //

        // Se o cliente enviou ?offset=, usa esse modo. offset é o número de registos a saltar. page é calculado a partir do offset para o campo pagination da resposta (ex: offset=20, limit=10 → página 3).

        let offset, page;
        if (req.query.offset !== undefined) {
            offset = Math.max(0, parseInt(req.query.offset) || 0);
            page   = Math.floor(offset / limit) + 1;
        } else {
            page   = Math.max(1, parseInt(req.query.page) || 1);
            offset = (page - 1) * limit;
        }
        // Uma única query ao MySQL que devolve dois valores: count = total de registos existentes (sem paginação), rows = apenas os registos da página pedida. Equivale a SELECT ... LIMIT x OFFSET y + SELECT COUNT(*) em simultâneo

        // Filtro opcional por status — validado para evitar queries com valores inválidos
        const validStatus = ['online', 'offline', 'manutencao'];
        const { status } = req.query;
        if (status && !validStatus.includes(status))
            return next(validationError({ status: `Estado inválido. Use: ${validStatus.join(', ')}` }));

        const where = status ? { status } : {};
        const { count, rows } = await Sensor.findAndCountAll({ where, limit, offset });

        const data  = rows.map(s => ({ ...s.toJSON(), _links: sensorLinks(s.idsensor) }));
        const pages = Math.ceil(count / limit);

        // Rejeita páginas fora dos limites (só verifica se existem registos)
        if (page > pages && pages > 0)
            return next(validationError({ page: `Página ${page} não existe. Total de páginas: ${pages}.` }));

        // 206 Partial Content se existem mais registos do que o limit (há mais páginas)
        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/sensores', method: 'GET' }, create: { href: '/sensores', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// GET /sensores/:id — devolve um sensor específico pelo ID
export const obterSensorPorId = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const sensor = await Sensor.findByPk(id);
        if (!sensor) return next(notFoundError('sensor', id));

        return res.status(200).json({
            ...sensor.toJSON(),
            _links: { ...sensorLinks(id), allSensores: { href: '/sensores', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// POST /sensores — cria um novo sensor
export const criarSensor = async (req, res, next) => {
    try {
        const { tipo, localizacao, status, idinfraestrutura_urbana, data_proxima_manutencao } = req.body;

        // Campos obrigatórios — array dinâmico para só reportar os que faltam
        const missingFields = [];
        if (!tipo)                    missingFields.push('tipo');
        if (!localizacao)             missingFields.push('localizacao');
        if (!idinfraestrutura_urbana) missingFields.push('idinfraestrutura_urbana');
        if (missingFields.length)     return next(missingFieldsValidationError(missingFields));

        // Valida o tipo do sensor
        if (!TIPOS_SENSOR_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_SENSOR_VALIDOS.join(', ')}` }));

        // Valida que idinfraestrutura_urbana é um inteiro positivo
        const infraId = parseInt(idinfraestrutura_urbana);
        if (isNaN(infraId) || infraId <= 0)
            return next(validationError({ idinfraestrutura_urbana: 'Deve ser um número inteiro positivo.' }));

        // Valida o estado do sensor (se fornecido)
        const validStatus = ['online', 'offline', 'manutencao'];
        if (status !== undefined && !validStatus.includes(status))
            return next(validationError({ status: 'Estado inválido. Use online, offline ou manutencao.' }));

        // Valida que a data de manutenção é futura (se fornecida)
        if (data_proxima_manutencao) {
            const erroData = validarDataFutura(data_proxima_manutencao, 'data_proxima_manutencao');
            if (erroData) return next(validationError(erroData));
        }

        // Cria o sensor — status padrão é 'offline' se não fornecido
        const newSensor = await Sensor.create({
            tipo,
            localizacao,
            status:                  status ?? 'offline',
            idinfraestrutura_urbana: infraId,
            data_proxima_manutencao: data_proxima_manutencao ?? null
        });

        // Devolve o link para aceder ao sensor criado
        return res.status(201).json({ _self: `/sensores/${newSensor.idsensor}` });
    } catch (error) {

        //SequelizeValidationError — disparado pelo Sequelize antes de chegar à BD, quando os dados violam as regras definidas no modelo (allowNull: false, validate: { isEmail }, etc.). A query SQL nunca chega a ser executada.Exemplo: enviar idinfraestrutura_urbana: null com allowNull: false

        if (error.name === 'SequelizeValidationError')
            return next(sequelizeValidationError(error.errors));
        // FK inválida: a infraestrutura indicada não existe na BD
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(validationError(`idinfraestrutura_urbana ${req.body.idinfraestrutura_urbana} não existe`));
        return next(genericError(error.message));
    }
};

// PATCH /sensores/:id — actualização parcial (só os campos enviados são alterados)
export const atualizarSensor = async (req, res, next) => {
    try {
        // Valida o id do params
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const { tipo, localizacao, status, idinfraestrutura_urbana, data_proxima_manutencao } = req.body;

        // Rejeita body vazio — nenhum campo para atualizar
        if (tipo === undefined && localizacao === undefined && status === undefined &&
            idinfraestrutura_urbana === undefined && data_proxima_manutencao === undefined)
            return next(missingFieldsValidationError(['tipo', 'localizacao', 'status', 'idinfraestrutura_urbana', 'data_proxima_manutencao (pelo menos um)']));

        // Validações dos campos enviados
        if (tipo !== undefined && !TIPOS_SENSOR_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_SENSOR_VALIDOS.join(', ')}` }));

        const validStatus = ['online', 'offline', 'manutencao'];
        if (status !== undefined && !validStatus.includes(status))
            return next(validationError({ status: 'Estado inválido. Use online, offline ou manutencao.' }));

        if (idinfraestrutura_urbana !== undefined) {
            const infraId = parseInt(idinfraestrutura_urbana);
            if (isNaN(infraId) || infraId <= 0)
                return next(validationError({ idinfraestrutura_urbana: 'Deve ser um número inteiro positivo.' }));
        }

        if (data_proxima_manutencao) {
            const erroData = validarDataFutura(data_proxima_manutencao, 'data_proxima_manutencao');
            if (erroData) return next(validationError(erroData));
        }

        // Todas as validações passaram — consulta a BD
        const sensor = await Sensor.findByPk(id);
        if (!sensor) return next(notFoundError('sensor', id));

        // Constrói o objecto só com os campos a alterar
        const updateData = {};
        if (tipo !== undefined) updateData.tipo = tipo;
        if (localizacao !== undefined) updateData.localizacao = localizacao;
        if (status !== undefined) updateData.status = status;
        if (idinfraestrutura_urbana !== undefined) updateData.idinfraestrutura_urbana = parseInt(idinfraestrutura_urbana);
        if (data_proxima_manutencao !== undefined) updateData.data_proxima_manutencao = data_proxima_manutencao;

        await sensor.update(updateData);

        return res.status(200).json({
            message: 'Sensor atualizado com sucesso',
            ...sensor.toJSON(),
            _links: { ...sensorLinks(id), allSensores: { href: '/sensores', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError')
            return next(sequelizeValidationError(error.errors));
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(validationError(`idinfraestrutura_urbana ${req.body.idinfraestrutura_urbana} não existe`));
        return next(genericError(error.message));
    }
};

// POST /sensores/:id/calibracao — regista calibração, atualiza data de manutenção
//   e notifica todos os utilizadores com tipo 'operador_municipal'
export const registarCalibracao = async (req, res, next) => {
    try {
        // Valida o id antes de qualquer acesso à BD
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const { data_proxima_manutencao, observacoes } = req.body;

        // Valida a data antes de consultar a BD
        if (data_proxima_manutencao) {
            const erroData = validarDataFutura(data_proxima_manutencao, 'data_proxima_manutencao');
            if (erroData) return next(validationError(erroData));
        }

        const sensor = await Sensor.findByPk(id);
        if (!sensor) return next(notFoundError('sensor', id));

        // Atualiza o sensor: marca como em manutenção e guarda a nova data
        const updateData = { status: 'manutencao' };
        if (data_proxima_manutencao) updateData.data_proxima_manutencao = data_proxima_manutencao;
        await sensor.update(updateData);

        const mensagem = `Sensor #${sensor.idsensor} (${sensor.tipo}) em "${sensor.localizacao}" registado para calibração/manutenção.`
            + (data_proxima_manutencao ? ` Próxima manutenção: ${data_proxima_manutencao}.` : '')
            + (observacoes ? ` Observações: ${observacoes}` : '');

        // Obtém todos os operadores municipais da tabela utilizador
        const operadores = await Utilizador.findAll({
            where: { tipo: ['operador_municipal', 'administrador'] },
            attributes: ['idutilizador', 'email']
        });

        if (!operadores.length)
            return res.status(200).json({
                message: 'Calibração registada. Aviso: não existem operadores municipais configurados no sistema — nenhuma notificação foi enviada.',
                ...sensor.toJSON()
            });

        // Para cada operador: cria notificação na BD e envia email
        // Promise.allSettled garante que uma falha não cancela os restantes envios
        const resultados = await Promise.allSettled(
            operadores.map(async (op) => {
                const notif = await Notificacao.create({
                    idalerta:       null, // calibração não está associada a um alerta
                    idsensor:       sensor.idsensor,
                    iddestinatario: null, // operadores estão em Utilizador, não em Destinatarios
                    canal:          'email',
                    estado_envio:   'pendente',
                    data_envio:     new Date(),
                    mensagem,
                    erro_envio:     null,
                });
                await enviarEmailCalibracao({
                    email:                   op.email,
                    idsensor:                sensor.idsensor,
                    tipo:                    sensor.tipo,
                    localizacao:             sensor.localizacao,
                    data_proxima_manutencao,
                    observacoes,
                });
                await notif.update({ estado_envio: 'enviado' });
            })
        );

        // Regista falhas no log sem bloquear a resposta
        resultados.forEach((r, i) => {
            if (r.status === 'rejected')
                console.error(`[calibracao] Falha ao notificar operador ${operadores[i]?.email}: ${r.reason?.message}`);
        });

        const enviados = resultados.filter(r => r.status === 'fulfilled').length;
        const falhados = resultados.filter(r => r.status === 'rejected').length;

        return res.status(200).json({
            message: `Calibração registada. ${enviados} notificação(ões) enviada(s)${falhados ? `, ${falhados} falhou` : ''}.`,
            ...sensor.reload().then(s => s.toJSON())
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// DELETE /sensores/:id — apaga o sensor
// ATENÇÃO — onDelete:CASCADE activo: apagar o sensor apaga também todas as suas leituras
//           e cada leitura apaga o alerta associado (ver db.config.js)
export const apagarSensor = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const sensor = await Sensor.findByPk(id);
        if (!sensor) return next(notFoundError('sensor', id));

        // Conta leituras dependentes para informar o cliente do impacto do CASCADE
        const totalLeituras = await LeituraSensor.count({ where: { idsensor: id } });

        // Se existem dependências, exige confirmação explícita via ?confirmar=true
        if (totalLeituras > 0 && req.query.confirmar !== 'true')
            return res.status(409).json({
                error:             'confirmacao_necessaria',
                error_description: `Apagar este sensor irá eliminar também ${totalLeituras} leitura(s) e os alertas associados. Confirme com ?confirmar=true.`,
                impacto:           { leituras: totalLeituras }
            });

        await sensor.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError(error.message));
    }
};
