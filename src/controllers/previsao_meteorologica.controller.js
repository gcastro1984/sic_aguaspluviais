import { Op } from 'sequelize';
import { PrevisaoMeteorologica, AreaRisco } from '../models/db.config.js';
import { missingFieldsValidationError, validationError, notFoundError, genericError, parsePagination } from '../utils/error.utils.js';

const previsaoLinks = (id) => ({
    self:   { href: `/previsoes/${id}`,  method: 'GET' },
    update: { href: `/previsoes/${id}`,  method: 'PATCH' },
    delete: { href: `/previsoes/${id}`,  method: 'DELETE' }
});

export const criarPrevisao = async (req, res, next) => {
    try {
        const { idarea_risco, fonte, data_emissao, data_inicio_previsao, data_fim_previsao, horizonte_horas, precipitacao_prevista_mm, confianca } = req.body;

        const missingFields = [];
        if (!idarea_risco) missingFields.push('idarea_risco');
        if (!fonte) missingFields.push('fonte');
        if (!data_inicio_previsao) missingFields.push('data_inicio_previsao');
        if (!data_fim_previsao) missingFields.push('data_fim_previsao');
        if (horizonte_horas === undefined) missingFields.push('horizonte_horas');
        if (precipitacao_prevista_mm === undefined) missingFields.push('precipitacao_prevista_mm');
        if (confianca === undefined) missingFields.push('confianca');

        if (missingFields.length) return next(missingFieldsValidationError(missingFields));

        if (confianca < 0 || confianca > 1)
            return next(validationError('Confiança deve estar entre 0 e 1'));

        if (horizonte_horas < 1 || !Number.isInteger(Number(horizonte_horas)))
            return next(validationError({ horizonte_horas: 'horizonte_horas deve ser um inteiro positivo (≥ 1)' }));

        if (precipitacao_prevista_mm < 0)
            return next(validationError({ precipitacao_prevista_mm: 'precipitacao_prevista_mm não pode ser negativa' }));

        if (new Date(data_fim_previsao) <= new Date(data_inicio_previsao))
            return next(validationError({ data_fim_previsao: 'data_fim_previsao deve ser posterior a data_inicio_previsao' }));

        const areaRisco = await AreaRisco.findByPk(idarea_risco);
        if (!areaRisco) return next(notFoundError('area_risco', idarea_risco));

        const previsao = await PrevisaoMeteorologica.create({
            idarea_risco, fonte,
            data_emissao: data_emissao || new Date(),
            data_inicio_previsao, data_fim_previsao,
            horizonte_horas, precipitacao_prevista_mm, confianca
        });

        return res.status(201).json({
            _self: `/previsoes/${previsao.idprevisao}`
        });
    } catch (error) {
        return next(genericError('Erro ao criar previsão meteorológica'));
    }
};

// GET /previsoes?idarea_risco=1&confianca_minima=0.8&page=1&limit=20
export const obterPrevisoes = async (req, res, next) => {
    try {
        const { idarea_risco, confianca_minima } = req.query;
        const { limit, offset, page, error } = parsePagination(req);
        if (error) return next(error);

        const where = {};
        if (idarea_risco) where.idarea_risco = parseInt(idarea_risco);
        if (confianca_minima !== undefined) {
            const conf = parseFloat(confianca_minima);
            if (isNaN(conf) || conf < 0 || conf > 1)
                return next(validationError('confianca_minima deve estar entre 0 e 1'));
            where.confianca = { [Op.gte]: conf };
        }

        const { count, rows } = await PrevisaoMeteorologica.findAndCountAll({
            where,
            include: [{ model: AreaRisco, attributes: ['idarea_risco', 'nome'] }],
            limit,
            offset
        });

        const data  = rows.map(p => ({ ...p.toJSON(), _links: previsaoLinks(p.idprevisao) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/previsoes', method: 'GET' }, create: { href: '/previsoes', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter previsões meteorológicas'));
    }
};

export const obterPrevisaoPorId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const previsao = await PrevisaoMeteorologica.findByPk(id, {
            include: [{ model: AreaRisco, attributes: ['idarea_risco', 'nome'] }]
        });

        if (!previsao) return next(notFoundError('previsão', id));

        return res.status(200).json({
            ...previsao.toJSON(),
            _links: { ...previsaoLinks(id), allPrevisoes: { href: '/previsoes', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter previsão meteorológica'));
    }
};

export const atualizarPrevisao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fonte, data_inicio_previsao, data_fim_previsao, horizonte_horas, precipitacao_prevista_mm, confianca } = req.body;

        const previsao = await PrevisaoMeteorologica.findByPk(id);
        if (!previsao) return next(notFoundError('previsão', id));

        if (confianca !== undefined && (confianca < 0 || confianca > 1))
            return next(validationError('Confiança deve estar entre 0 e 1'));

        if (horizonte_horas !== undefined && (horizonte_horas < 1 || !Number.isInteger(Number(horizonte_horas))))
            return next(validationError({ horizonte_horas: 'horizonte_horas deve ser um inteiro positivo (≥ 1)' }));

        if (precipitacao_prevista_mm !== undefined && precipitacao_prevista_mm < 0)
            return next(validationError({ precipitacao_prevista_mm: 'precipitacao_prevista_mm não pode ser negativa' }));

        if (data_inicio_previsao && data_fim_previsao && new Date(data_fim_previsao) <= new Date(data_inicio_previsao))
            return next(validationError({ data_fim_previsao: 'data_fim_previsao deve ser posterior a data_inicio_previsao' }));

        const updateData = {};
        if (fonte !== undefined) updateData.fonte = fonte;
        if (data_inicio_previsao !== undefined) updateData.data_inicio_previsao = data_inicio_previsao;
        if (data_fim_previsao !== undefined) updateData.data_fim_previsao = data_fim_previsao;
        if (horizonte_horas !== undefined) updateData.horizonte_horas = horizonte_horas;
        if (precipitacao_prevista_mm !== undefined) updateData.precipitacao_prevista_mm = precipitacao_prevista_mm;
        if (confianca !== undefined) updateData.confianca = confianca;

        await previsao.update(updateData);

        return res.status(200).json({
            message: 'Previsão meteorológica atualizada com sucesso',
            ...previsao.toJSON(),
            _links: { ...previsaoLinks(id), allPrevisoes: { href: '/previsoes', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao atualizar previsão meteorológica'));
    }
};

// PUT /previsoes/:id – substituição completa
export const substituirPrevisao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { idarea_risco, fonte, data_emissao, data_inicio_previsao, data_fim_previsao, horizonte_horas, precipitacao_prevista_mm, confianca } = req.body;

        const missingFields = [];
        if (!idarea_risco)              missingFields.push('idarea_risco');
        if (!fonte)                     missingFields.push('fonte');
        if (!data_inicio_previsao)      missingFields.push('data_inicio_previsao');
        if (!data_fim_previsao)         missingFields.push('data_fim_previsao');
        if (horizonte_horas === undefined)          missingFields.push('horizonte_horas');
        if (precipitacao_prevista_mm === undefined)  missingFields.push('precipitacao_prevista_mm');
        if (confianca === undefined)    missingFields.push('confianca');
        if (missingFields.length) return next(missingFieldsValidationError(missingFields));

        if (confianca < 0 || confianca > 1)
            return next(validationError('Confiança deve estar entre 0 e 1'));

        if (horizonte_horas < 1 || !Number.isInteger(Number(horizonte_horas)))
            return next(validationError({ horizonte_horas: 'horizonte_horas deve ser um inteiro positivo (≥ 1)' }));

        if (precipitacao_prevista_mm < 0)
            return next(validationError({ precipitacao_prevista_mm: 'precipitacao_prevista_mm não pode ser negativa' }));

        if (new Date(data_fim_previsao) <= new Date(data_inicio_previsao))
            return next(validationError({ data_fim_previsao: 'data_fim_previsao deve ser posterior a data_inicio_previsao' }));

        const previsao = await PrevisaoMeteorologica.findByPk(id);
        if (!previsao) return next(notFoundError('previsão', id));

        const areaRisco = await AreaRisco.findByPk(idarea_risco);
        if (!areaRisco) return next(notFoundError('area_risco', idarea_risco));

        await previsao.update({
            idarea_risco, fonte,
            data_emissao: data_emissao || new Date(),
            data_inicio_previsao, data_fim_previsao,
            horizonte_horas, precipitacao_prevista_mm, confianca
        });

        return res.status(200).json({
            message: 'Previsão substituída com sucesso',
            ...previsao.toJSON(),
            _links: { ...previsaoLinks(id), allPrevisoes: { href: '/previsoes', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao substituir previsão meteorológica'));
    }
};

export const apagarPrevisao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const previsao = await PrevisaoMeteorologica.findByPk(id);

        if (!previsao) return next(notFoundError('previsão', id));

        await previsao.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError('Erro ao deletar previsão meteorológica'));
    }
};
