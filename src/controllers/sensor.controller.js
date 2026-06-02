import { Sensor } from '../models/db.config.js';
import { sequelizeValidationError, validationError, notFoundError, genericError } from '../utils/error.utils.js';

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
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        let offset, page;
        if (req.query.offset !== undefined) {
            offset = Math.max(0, parseInt(req.query.offset) || 0);
            page   = Math.floor(offset / limit) + 1;
        } else {
            page   = Math.max(1, parseInt(req.query.page) || 1);
            offset = (page - 1) * limit;
        }

        const { count, rows } = await Sensor.findAndCountAll({ limit, offset });

        const data  = rows.map(s => ({ ...s.toJSON(), _links: sensorLinks(s.idsensor) }));
        const pages = Math.ceil(count / limit);

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
        const { id } = req.params;
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

        // Campos obrigatórios
        if (!tipo || !localizacao)
            return next(validationError({ tipo: 'Campo tipo é obrigatório.', localizacao: 'Campo localizacao é obrigatório.' }));

        // Valida o tipo do sensor
        if (!TIPOS_SENSOR_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_SENSOR_VALIDOS.join(', ')}` }));

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
            status: status ?? 'offline',
            idinfraestrutura_urbana: idinfraestrutura_urbana ?? null,
            data_proxima_manutencao: data_proxima_manutencao ?? null
        });

        // Devolve o link para aceder ao sensor criado
        return res.status(201).json({ _self: `/sensores/${newSensor.idsensor}` });
    } catch (error) {
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
        const { id } = req.params;
        const { tipo, localizacao, status, idinfraestrutura_urbana, data_proxima_manutencao } = req.body;

        // Validações apenas para os campos que foram enviados
        if (tipo !== undefined && !TIPOS_SENSOR_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_SENSOR_VALIDOS.join(', ')}` }));

        const validStatus = ['online', 'offline', 'manutencao'];
        if (status !== undefined && !validStatus.includes(status))
            return next(validationError({ status: 'Estado inválido. Use online, offline ou manutencao.' }));

        if (data_proxima_manutencao) {
            const erroData = validarDataFutura(data_proxima_manutencao, 'data_proxima_manutencao');
            if (erroData) return next(validationError(erroData));
        }

        const sensor = await Sensor.findByPk(id);
        if (!sensor) return next(notFoundError('sensor', id));

        // Constrói o objecto só com os campos a alterar
        const updateData = {};
        if (tipo !== undefined) updateData.tipo = tipo;
        if (localizacao !== undefined) updateData.localizacao = localizacao;
        if (status !== undefined) updateData.status = status;
        if (idinfraestrutura_urbana !== undefined) updateData.idinfraestrutura_urbana = idinfraestrutura_urbana;
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

// DELETE /sensores/:id — apaga o sensor
// ATENÇÃO — onDelete:CASCADE activo: apagar o sensor apaga também todas as suas leituras
//           e cada leitura apaga o alerta associado (ver db.config.js)
export const apagarSensor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const sensor = await Sensor.findByPk(id);

        if (!sensor) return next(notFoundError('sensor', id));

        await sensor.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError(error.message));
    }
};
