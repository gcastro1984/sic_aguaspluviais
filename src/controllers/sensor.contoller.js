import { Sensor, Notificacao, Destinatarios } from '../models/db.config.js';
import { sequelizeValidationError, validationError, notFoundError, genericError } from '../utils/error.utils.js';

const TIPOS_SENSOR_VALIDOS = ['nivel_agua', 'precipitacao', 'caudal', 'temperatura', 'humidade'];

// Valida que a data é válida e estritamente futura (> hoje)
function validarDataFutura(valor, campo) {
    const d = new Date(valor);
    if (isNaN(d.getTime())) return { [campo]: 'Data inválida' };
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (d <= hoje) return { [campo]: `${campo} deve ser uma data futura` };
    return null;
}

const sensorLinks = (id) => ({
    self:    { href: `/sensores/${id}`,  method: 'GET' },
    replace: { href: `/sensores/${id}`,  method: 'PUT' },
    update:  { href: `/sensores/${id}`,  method: 'PATCH' },
    delete:  { href: `/sensores/${id}`,  method: 'DELETE' }
});

export const getAllSensors = async (req, res, next) => {
    try {
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
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

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/sensores', method: 'GET' }, create: { href: '/sensores', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

export const getSensorById = async (req, res, next) => {
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

export const createNewSensor = async (req, res, next) => {
    try {
        const { tipo, localizacao, status, idinfraestrutura_urbana, data_proxima_manutencao } = req.body;

        if (!tipo || !localizacao)
            return next(validationError({ tipo: 'Campo tipo é obrigatório.', localizacao: 'Campo localizacao é obrigatório.' }));

        if (!TIPOS_SENSOR_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_SENSOR_VALIDOS.join(', ')}` }));

        const validStatus = ['online', 'offline', 'manutencao'];
        if (status !== undefined && !validStatus.includes(status))
            return next(validationError({ status: 'Status inválido. Use online, offline ou manutencao.' }));

        if (data_proxima_manutencao) {
            const erroData = validarDataFutura(data_proxima_manutencao, 'data_proxima_manutencao');
            if (erroData) return next(validationError(erroData));
        }

        const newSensor = await Sensor.create({
            tipo,
            localizacao,
            status: status ?? 'offline',
            idinfraestrutura_urbana: idinfraestrutura_urbana ?? null,
            data_proxima_manutencao: data_proxima_manutencao ?? null
        });

        return res.status(201).json({
            _self: `/sensores/${newSensor.idsensor}`
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        if (error.name === 'SequelizeForeignKeyConstraintError') return next(validationError(`idinfraestrutura_urbana ${req.body.idinfraestrutura_urbana} não existe`));
        return next(genericError(error.message));
    }
};

export const atualizarSensor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tipo, localizacao, status, idinfraestrutura_urbana, data_proxima_manutencao } = req.body;

        if (tipo !== undefined && !TIPOS_SENSOR_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_SENSOR_VALIDOS.join(', ')}` }));

        const validStatus = ['online', 'offline', 'manutencao'];
        if (status !== undefined && !validStatus.includes(status))
            return next(validationError({ status: 'Status inválido. Use online, offline ou manutencao.' }));

        if (data_proxima_manutencao) {
            const erroData = validarDataFutura(data_proxima_manutencao, 'data_proxima_manutencao');
            if (erroData) return next(validationError(erroData));
        }

        const sensor = await Sensor.findByPk(id);
        if (!sensor) return next(notFoundError('sensor', id));

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
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        if (error.name === 'SequelizeForeignKeyConstraintError') return next(validationError(`idinfraestrutura_urbana ${req.body.idinfraestrutura_urbana} não existe`));
        return next(genericError(error.message));
    }
};

// PUT /sensores/:id  – substituição completa do recurso
export const substituirSensor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tipo, localizacao, status, idinfraestrutura_urbana, data_proxima_manutencao } = req.body;

        if (!tipo || !localizacao)
            return next(validationError('tipo e localizacao são obrigatórios', { tipo: 'obrigatório', localizacao: 'obrigatório' }));

        if (!TIPOS_SENSOR_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_SENSOR_VALIDOS.join(', ')}` }));

        const validStatus = ['online', 'offline', 'manutencao'];
        if (status !== undefined && !validStatus.includes(status))
            return next(validationError({ status: 'Status inválido. Use online, offline ou manutencao.' }));

        if (data_proxima_manutencao) {
            const erroData = validarDataFutura(data_proxima_manutencao, 'data_proxima_manutencao');
            if (erroData) return next(validationError(erroData));
        }

        const sensor = await Sensor.findByPk(id);
        if (!sensor) return next(notFoundError('sensor', id));

        await sensor.update({
            tipo,
            localizacao,
            status:                   validStatus.includes(status) ? status : 'offline',
            idinfraestrutura_urbana:  idinfraestrutura_urbana  ?? null,
            data_proxima_manutencao:  data_proxima_manutencao  ?? null
        });

        return res.status(200).json({
            message: 'Sensor substituído com sucesso',
            ...sensor.toJSON(),
            _links: { ...sensorLinks(id), allSensores: { href: '/sensores', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        if (error.name === 'SequelizeForeignKeyConstraintError') return next(validationError(`idinfraestrutura_urbana ${req.body.idinfraestrutura_urbana} não existe`));
        return next(genericError(error.message));
    }
};

export const deletarSensor = async (req, res, next) => {
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

// POST /sensores/:id/calibracao
// Acção controller (apenas operador_municipal / administrador):
//   • regista que o operador vai calibrar o sensor
//   • coloca o sensor em estado "manutencao"
//   • notifica os destinatários do tipo "responsavel" para ficarem a par
export const notificarCalibracao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { canal = 'email', data_proxima_manutencao, observacoes } = req.body;

        const canaisValidos = ['email', 'sms', 'push'];
        if (!canaisValidos.includes(canal))
            return next(validationError({ canal: `Canal inválido. Use: ${canaisValidos.join(', ')}` }));

        if (data_proxima_manutencao) {
            const erroData = validarDataFutura(data_proxima_manutencao, 'data_proxima_manutencao');
            if (erroData) return next(validationError(erroData));
        }

        // Quem está a fazer a calibração (vem do JWT via verifyToken)
        const operadorId   = req.user.sub;
        const operadorTipo = req.user.tipo;   // 'operador_municipal' ou 'administrador'

        // 1. Verificar que o sensor existe
        const sensor = await Sensor.findByPk(id);
        if (!sensor) return next(notFoundError('sensor', id));

        // 2. Colocar o sensor em estado "manutencao"
        const updateData = { status: 'manutencao' };
        if (data_proxima_manutencao) updateData.data_proxima_manutencao = data_proxima_manutencao;
        await sensor.update(updateData);

        // 3. Encontrar destinatários responsáveis (gestores que devem ser informados)
        //    O operador que faz a calibração não precisa de notificação — ele já sabe.
        const responsaveis = await Destinatarios.findAll({ where: { tipo: 'responsavel' } });

        if (!responsaveis.length) {
            return res.status(200).json({
                message: 'Sensor colocado em manutenção, mas não existem destinatários do tipo "responsavel" para notificar.',
                data: { sensor: sensor.toJSON() },
                _links: {
                    sensor:          { href: `/sensores/${id}`, method: 'GET' },
                    destinatarios:   { href: `/destinatarios`,  method: 'GET' }
                }
            });
        }

        // 4. Construir a mensagem — identifica o operador que registou a calibração
        const dataTexto = data_proxima_manutencao
            ? `Data prevista: ${new Date(data_proxima_manutencao).toLocaleDateString('pt-PT')}.`
            : 'Data de conclusão a definir.';

        const mensagem =
            `[CALIBRAÇÃO] O sensor #${sensor.idsensor} (${sensor.tipo}) ` +
            `em "${sensor.localizacao}" foi registado para calibração ` +
            `pelo utilizador #${operadorId} (${operadorTipo}). ` +
            dataTexto +
            (observacoes ? ` Observações: ${observacoes}` : '');

        // 5. Criar uma notificação por cada responsável
        const notificacoes = await Promise.all(
            responsaveis.map(resp =>
                Notificacao.create({
                    idalerta:       null,               // calibração não está ligada a um alerta
                    idsensor:       sensor.idsensor,
                    iddestinatario: resp.iddestinatario,
                    canal,
                    estado_envio:   'pendente',
                    data_envio:     new Date(),
                    mensagem
                })
            )
        );

        return res.status(201).json({
            message: `Calibração registada pelo operador #${operadorId}. ${notificacoes.length} responsável notificado.`,
            data: {
                sensor:       sensor.toJSON(),
                notificacoes: notificacoes.map(n => n.toJSON())
            },
            _links: {
                sensor:          { href: `/sensores/${id}`, method: 'GET' },
                notificacoes:    { href: `/notificacoes`,   method: 'GET' },
                reporOnline:     { href: `/sensores/${id}`, method: 'PATCH' }
            }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};
