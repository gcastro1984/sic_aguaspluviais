import { Alerta, AreaRisco, NivelAlerta, PrevisaoMeteorologica, CriterioAlerta, InfraestruturaUrbana, LeituraSensor } from '../models/db.config.js';
import { verificarAlertas } from '../utils/alerta.utils.js';
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from '../utils/error.utils.js';
import { getPagination, paginationMeta } from '../utils/pagination.utils.js';

const alertaLinks = (id) => ({
    self:   { href: `/alertas/${id}`,  method: 'GET' },
    update: { href: `/alertas/${id}`,  method: 'PATCH' },
    delete: { href: `/alertas/${id}`,  method: 'DELETE' }
});

export const criarAlerta = async (req, res, next) => {
    try {
        const { idleitura_sensor } = req.body;

        if (!idleitura_sensor) return next(missingFieldsValidationError(['idleitura_sensor']));

        const leitura = await LeituraSensor.findByPk(idleitura_sensor);
        if (!leitura) return next(notFoundError('leitura', idleitura_sensor));

        const resultado = await verificarAlertas(leitura);

        if (resultado.nivel === 1)
            return res.status(200).json({ message: 'Sem alerta (nível verde)' });

        const existente = await Alerta.findOne({ where: { idarea_risco: resultado.idarea_risco, estado: 'ativo' } });

        if (existente) {
            if (
                Number(existente.idnivel_alerta) !== Number(resultado.nivel) ||
                Number(existente.score_risco) !== Number(resultado.score_risco)
            ) {
                await existente.update({
                    idnivel_alerta: resultado.nivel,
                    descricao: resultado.mensagem,
                    score_risco: resultado.score_risco || existente.score_risco,
                    idleitura_sensor: leitura.idleitura_sensor
                });
                return res.status(200).json({ message: 'Alerta atualizado', data: existente, links: alertaLinks(existente.idalerta) });
            }
            return res.status(200).json({ message: 'Já existe alerta ativo (sem alterações)', data: existente, links: alertaLinks(existente.idalerta) });
        }

        const newAlerta = await Alerta.create({
            idnivel_alerta: resultado.nivel,
            idarea_risco: resultado.idarea_risco,
            idinfraestrutura_urbana: resultado.idinfraestrutura_urbana,
            idleitura_sensor: leitura.idleitura_sensor,
            descricao: resultado.mensagem,
            score_risco: resultado.score_risco || 0,
            estado: 'ativo'
        });

        return res.status(201).json({ data: newAlerta, links: alertaLinks(newAlerta.idalerta) });
    } catch (error) {
        next(genericError('Erro ao criar alerta'));
    }
};

// GET /alertas?estado=ativo&page=1&limit=20
export const obterAlertas = async (req, res, next) => {
    try {
        const { estado } = req.query;
        const { page, limit, offset } = getPagination(req.query);

        const estadosValidos = ['ativo', 'resolvido', 'cancelado'];
        if (estado && !estadosValidos.includes(estado))
            return next(validationError('estado deve ser: ativo, resolvido ou cancelado'));

        const where = estado ? { estado } : {};
        const { count, rows } = await Alerta.findAndCountAll({ where, limit, offset });

        const data = rows.map(a => ({ ...a.toJSON(), links: alertaLinks(a.idalerta) }));

        return res.status(200).json({
            data,
            pagination: paginationMeta(count, page, limit),
            links: { self: { href: '/alertas', method: 'GET' }, create: { href: '/alertas', method: 'POST' } }
        });
    } catch (error) {
        next(genericError('Erro ao obter alertas'));
    }
};

export const obterAlertaPorId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const alerta = await Alerta.findByPk(id, {
            include: [
                { model: AreaRisco, include: [{ model: PrevisaoMeteorologica, attributes: ['idprevisao', 'fonte', 'data_emissao', 'data_inicio_previsao', 'data_fim_previsao', 'horizonte_horas', 'precipitacao_prevista_mm', 'confianca'] }] },
                { model: NivelAlerta, include: [{ model: CriterioAlerta, where: { ativo: true }, required: false }] },
                { model: InfraestruturaUrbana }
            ]
        });

        if (!alerta) return next(notFoundError('alerta', id));

        return res.status(200).json({
            data: alerta,
            links: { ...alertaLinks(id), allAlertas: { href: '/alertas', method: 'GET' } }
        });
    } catch (error) {
        next(genericError('Erro ao obter alerta'));
    }
};

export const atualizarAlerta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { idnivel_alerta, idarea_risco, idinfraestrutura_urbana, data_alerta, descricao, score_risco, estado } = req.body;

        const alerta = await Alerta.findByPk(id);
        if (!alerta) return next(notFoundError('alerta', id));

        if (score_risco !== undefined && (score_risco < 0 || score_risco > 100))
            return next(validationError('score_risco deve estar entre 0 e 100'));

        const updateData = {};
        if (idnivel_alerta !== undefined) updateData.idnivel_alerta = idnivel_alerta;
        if (idarea_risco !== undefined) updateData.idarea_risco = idarea_risco;
        if (idinfraestrutura_urbana !== undefined) updateData.idinfraestrutura_urbana = idinfraestrutura_urbana;
        if (data_alerta !== undefined) updateData.data_alerta = data_alerta;
        if (descricao !== undefined) updateData.descricao = descricao;
        if (score_risco !== undefined) updateData.score_risco = score_risco;
        if (estado !== undefined) updateData.estado = estado;

        await alerta.update(updateData);

        return res.status(200).json({
            message: 'Alerta atualizado com sucesso',
            data: alerta,
            links: { ...alertaLinks(id), allAlertas: { href: '/alertas', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') next(sequelizeValidationError(error.errors));
        else next(genericError('Erro ao atualizar alerta'));
    }
};

export const apagarAlerta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const alerta = await Alerta.findByPk(id);

        if (!alerta) return next(notFoundError('alerta', id));

        await alerta.destroy();
        return res.status(204).send();
    } catch (error) {
        next(genericError('Erro ao apagar alerta'));
    }
};
