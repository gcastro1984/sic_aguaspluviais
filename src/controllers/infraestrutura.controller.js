import { InfraestruturaUrbana } from '../models/db.config.js';
import { validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from '../utils/error.utils.js';
import { getPagination, paginationMeta } from '../utils/pagination.utils.js';

const infraLinks = (id) => ({
    self:   { href: `/infraestruturas/${id}`,  method: 'GET' },
    update: { href: `/infraestruturas/${id}`,  method: 'PATCH' },
    delete: { href: `/infraestruturas/${id}`,  method: 'DELETE' }
});

export const criarInfraestruturaUrbana = async (req, res, next) => {
    try {
        const { nome, tipo, localizacao, idarea_risco } = req.body;

        if (!nome || !tipo || !localizacao || !idarea_risco)
            return next(missingFieldsValidationError(['nome', 'tipo', 'localizacao', 'idarea_risco']));

        const newInfra = await InfraestruturaUrbana.create({ nome, tipo, localizacao, idarea_risco });

        return res.status(201).json({
            data: newInfra,
            links: { ...infraLinks(newInfra.idinfraestrutura_urbana), allInfras: { href: '/infraestruturas', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') next(sequelizeValidationError(error.errors));
        else if (error.name === 'SequelizeForeignKeyConstraintError') next(validationError(`Área de risco com ID ${req.body.idarea_risco} não encontrada`));
        else next(genericError('Erro ao criar infraestrutura urbana'));
    }
};

// GET /infraestruturas?idarea_risco=1&tipo=X&page=1&limit=20
export const obterInfraestruturas = async (req, res, next) => {
    try {
        const { idarea_risco, tipo } = req.query;
        const { page, limit, offset } = getPagination(req.query);

        const where = {};
        if (idarea_risco) where.idarea_risco = parseInt(idarea_risco);
        if (tipo) where.tipo = tipo;

        const { count, rows } = await InfraestruturaUrbana.findAndCountAll({ where, limit, offset });

        const data = rows.map(i => ({ ...i.toJSON(), links: infraLinks(i.idinfraestrutura_urbana) }));

        return res.status(200).json({
            data,
            pagination: paginationMeta(count, page, limit),
            links: { self: { href: '/infraestruturas', method: 'GET' }, create: { href: '/infraestruturas', method: 'POST' } }
        });
    } catch (error) {
        next(genericError('Erro ao obter infraestruturas urbanas'));
    }
};

export const obterInfraestruturaUrbanaId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const infra = await InfraestruturaUrbana.findByPk(id);

        if (!infra) return next(notFoundError('infraestrutura urbana', id));

        return res.status(200).json({
            data: infra,
            links: { ...infraLinks(id), allInfras: { href: '/infraestruturas', method: 'GET' } }
        });
    } catch (error) {
        next(genericError('Erro ao obter infraestrutura urbana'));
    }
};

export const atualizarInfraestruturaUrbana = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, tipo, localizacao, idarea_risco } = req.body;

        const infra = await InfraestruturaUrbana.findByPk(id);
        if (!infra) return next(notFoundError('infraestrutura urbana', id));

        const updateData = {};
        if (nome !== undefined) updateData.nome = nome;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (localizacao !== undefined) updateData.localizacao = localizacao;
        if (idarea_risco !== undefined) updateData.idarea_risco = idarea_risco;

        await infra.update(updateData);

        return res.status(200).json({
            message: 'Infraestrutura urbana atualizada com sucesso',
            data: infra,
            links: { ...infraLinks(id), allInfras: { href: '/infraestruturas', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') next(sequelizeValidationError(error.errors));
        else if (error.name === 'SequelizeForeignKeyConstraintError') next(validationError(`Área de risco com ID ${req.body.idarea_risco} não encontrada`));
        else next(genericError('Erro ao atualizar infraestrutura urbana'));
    }
};

export const deletarInfraestruturaUrbana = async (req, res, next) => {
    try {
        const { id } = req.params;
        const infra = await InfraestruturaUrbana.findByPk(id);

        if (!infra) return next(notFoundError('infraestrutura urbana', id));

        await infra.destroy();
        return res.status(204).send();
    } catch (error) {
        next(genericError('Erro ao deletar infraestrutura urbana'));
    }
};
