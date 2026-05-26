import { AreaRisco } from '../models/db.config.js';
import { validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from '../utils/error.utils.js';

const areaLinks = (id) => ({
    self:    { href: `/areas-risco/${id}`,  method: 'GET' },
    replace: { href: `/areas-risco/${id}`,  method: 'PUT' },
    update:  { href: `/areas-risco/${id}`,  method: 'PATCH' },
    delete:  { href: `/areas-risco/${id}`,  method: 'DELETE' }
});

export const criarAreaRisco = async (req, res, next) => {
    try {
        const { nome, localizacao, vulnerabilidade_base, descricao } = req.body;

        if (!nome || !localizacao || vulnerabilidade_base === undefined)
            return next(missingFieldsValidationError(['nome', 'localizacao', 'vulnerabilidade_base']));

        if (vulnerabilidade_base < 1 || vulnerabilidade_base > 5)
            return next(validationError('vulnerabilidade_base deve estar entre 1 e 5'));

        const newAreaRisco = await AreaRisco.create({ nome, localizacao, vulnerabilidade_base, descricao: descricao || null });

        return res.status(201).json({
            _self: `/areas-risco/${newAreaRisco.idarea_risco}`
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') next(sequelizeValidationError(error.errors));
        else if (error.name === 'SequelizeUniqueConstraintError') next(validationError(`Área de risco com nome '${req.body.nome}' já existe`));
        else next(genericError('Erro ao criar área de risco'));
    }
};

// GET /areas-risco?vulnerabilidade=3&page=1&limit=20
export const obterAreasRisco = async (req, res, next) => {
    try {
        const { vulnerabilidade } = req.query;
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        let offset, page;
        if (req.query.offset !== undefined) {
            offset = Math.max(0, parseInt(req.query.offset) || 0);
            page   = Math.floor(offset / limit) + 1;
        } else {
            page   = Math.max(1, parseInt(req.query.page) || 1);
            offset = (page - 1) * limit;
        }

        if (vulnerabilidade !== undefined) {
            const nivel = parseInt(vulnerabilidade);
            if (isNaN(nivel) || nivel < 1 || nivel > 5)
                return next(validationError('vulnerabilidade deve estar entre 1 e 5'));
        }

        const where = vulnerabilidade ? { vulnerabilidade_base: parseInt(vulnerabilidade) } : {};
        const { count, rows } = await AreaRisco.findAndCountAll({ where, limit, offset });

        const data  = rows.map(a => ({ ...a.toJSON(), _links: areaLinks(a.idarea_risco) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/areas-risco', method: 'GET' }, create: { href: '/areas-risco', method: 'POST' } }
        });
    } catch (error) {
        next(genericError('Erro ao obter áreas de risco'));
    }
};

export const obterAreaRiscoPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const area = await AreaRisco.findByPk(id);

        if (!area) return next(notFoundError('área de risco', id));

        return res.status(200).json({
            ...area.toJSON(),
            _links: { ...areaLinks(id), allAreas: { href: '/areas-risco', method: 'GET' } }
        });
    } catch (error) {
        next(genericError('Erro ao obter área de risco'));
    }
};

export const atualizarAreaRisco = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, localizacao, vulnerabilidade_base, descricao } = req.body;

        const area = await AreaRisco.findByPk(id);
        if (!area) return next(notFoundError('área de risco', id));

        if (vulnerabilidade_base !== undefined && (vulnerabilidade_base < 1 || vulnerabilidade_base > 5))
            return next(validationError('vulnerabilidade_base deve estar entre 1 e 5'));

        const updateData = {};
        if (nome !== undefined) updateData.nome = nome;
        if (localizacao !== undefined) updateData.localizacao = localizacao;
        if (vulnerabilidade_base !== undefined) updateData.vulnerabilidade_base = vulnerabilidade_base;
        if (descricao !== undefined) updateData.descricao = descricao;

        await area.update(updateData);

        return res.status(200).json({
            message: 'Área de risco atualizada com sucesso',
            ...area.toJSON(),
            _links: { ...areaLinks(id), allAreas: { href: '/areas-risco', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') next(sequelizeValidationError(error.errors));
        else if (error.name === 'SequelizeUniqueConstraintError') next(validationError(`Área de risco com nome '${req.body.nome}' já existe`));
        else next(genericError('Erro ao atualizar área de risco'));
    }
};

// PUT /areas-risco/:id  – substituição completa
export const substituirAreaRisco = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, localizacao, vulnerabilidade_base, descricao } = req.body;

        if (!nome || !localizacao || vulnerabilidade_base === undefined)
            return next(missingFieldsValidationError(['nome', 'localizacao', 'vulnerabilidade_base']));

        if (vulnerabilidade_base < 1 || vulnerabilidade_base > 5)
            return next(validationError('vulnerabilidade_base deve estar entre 1 e 5'));

        const area = await AreaRisco.findByPk(id);
        if (!area) return next(notFoundError('área de risco', id));

        await area.update({ nome, localizacao, vulnerabilidade_base, descricao: descricao ?? null });

        return res.status(200).json({
            message: 'Área de risco substituída com sucesso',
            ...area.toJSON(),
            _links: { ...areaLinks(id), allAreas: { href: '/areas-risco', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') next(sequelizeValidationError(error.errors));
        else if (error.name === 'SequelizeUniqueConstraintError') next(validationError(`Área de risco com nome '${req.body.nome}' já existe`));
        else next(genericError('Erro ao substituir área de risco'));
    }
};

export const deletarAreaRisco = async (req, res, next) => {
    try {
        const { id } = req.params;
        const area = await AreaRisco.findByPk(id);

        if (!area) return next(notFoundError('área de risco', id));

        await area.destroy();
        return res.status(204).send();
    } catch (error) {
        next(genericError('Erro ao deletar área de risco'));
    }
};
