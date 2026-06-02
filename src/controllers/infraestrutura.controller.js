import { InfraestruturaUrbana } from '../models/db.config.js';
import { validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError, conflictError } from '../utils/error.utils.js';

// Links HATEOAS — acções disponíveis para uma infraestrutura específica
const infraLinks = (id) => ({
    self:   { href: `/infraestruturas/${id}`, method: 'GET' },
    update: { href: `/infraestruturas/${id}`, method: 'PATCH' },
    delete: { href: `/infraestruturas/${id}`, method: 'DELETE' }
});

// POST /infraestruturas — cria uma nova infraestrutura urbana
export const criarInfraestruturaUrbana = async (req, res, next) => {
    try {
        const { nome, tipo, localizacao, idarea_risco } = req.body;

        // Campos obrigatórios
        if (!nome || !tipo || !localizacao || !idarea_risco)
            return next(missingFieldsValidationError(['nome', 'tipo', 'localizacao', 'idarea_risco']));

        const newInfra = await InfraestruturaUrbana.create({ nome, tipo, localizacao, idarea_risco });

        return res.status(201).json({ _self: `/infraestruturas/${newInfra.idinfraestrutura_urbana}` });
    } catch (error) {
        if (error.name === 'SequelizeValidationError')
            return next(sequelizeValidationError(error.errors));
        // FK inválida: a área de risco indicada não existe na BD
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(validationError(`Área de risco com ID ${req.body.idarea_risco} não encontrada`));
        return next(genericError('Erro ao criar infraestrutura urbana'));
    }
};

// GET /infraestruturas?idarea_risco=1&tipo=X&page=1&limit=20 — lista com paginação
// Filtros opcionais: ?idarea_risco= e ?tipo=
export const obterInfraestruturas = async (req, res, next) => {
    try {
        const { idarea_risco, tipo } = req.query;
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        let offset, page;
        if (req.query.offset !== undefined) {
            offset = Math.max(0, parseInt(req.query.offset) || 0);
            page   = Math.floor(offset / limit) + 1;
        } else {
            page   = Math.max(1, parseInt(req.query.page) || 1);
            offset = (page - 1) * limit;
        }

        // Aplica filtros apenas se os parâmetros foram enviados
        const where = {};
        if (idarea_risco) where.idarea_risco = parseInt(idarea_risco);
        if (tipo) where.tipo = tipo;

        const { count, rows } = await InfraestruturaUrbana.findAndCountAll({ where, limit, offset });

        const data  = rows.map(i => ({ ...i.toJSON(), _links: infraLinks(i.idinfraestrutura_urbana) }));
        const pages = Math.ceil(count / limit);

        // 206 Partial Content se existem mais registos do que o limit
        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/infraestruturas', method: 'GET' }, create: { href: '/infraestruturas', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter infraestruturas urbanas'));
    }
};

// GET /infraestruturas/:id — devolve uma infraestrutura específica pelo ID
export const obterInfraestruturaUrbanaId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const infra = await InfraestruturaUrbana.findByPk(id);

        if (!infra) return next(notFoundError('infraestrutura urbana', id));

        return res.status(200).json({
            ...infra.toJSON(),
            _links: { ...infraLinks(id), allInfras: { href: '/infraestruturas', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter infraestrutura urbana'));
    }
};

// PATCH /infraestruturas/:id — actualização parcial (só os campos enviados são alterados)
export const atualizarInfraestruturaUrbana = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, tipo, localizacao, idarea_risco } = req.body;

        const infra = await InfraestruturaUrbana.findByPk(id);
        if (!infra) return next(notFoundError('infraestrutura urbana', id));

        // Constrói o objecto só com os campos a alterar
        const updateData = {};
        if (nome !== undefined) updateData.nome = nome;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (localizacao !== undefined) updateData.localizacao = localizacao;
        if (idarea_risco !== undefined) updateData.idarea_risco = idarea_risco;

        await infra.update(updateData);

        return res.status(200).json({
            message: 'Infraestrutura urbana atualizada com sucesso',
            ...infra.toJSON(),
            _links: { ...infraLinks(id), allInfras: { href: '/infraestruturas', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError')
            return next(sequelizeValidationError(error.errors));
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(validationError(`Área de risco com ID ${req.body.idarea_risco} não encontrada`));
        return next(genericError('Erro ao atualizar infraestrutura urbana'));
    }
};

// DELETE /infraestruturas/:id — apaga a infraestrutura
// ATENÇÃO — SEM onDelete:CASCADE para sensores: bloqueia se existirem sensores associados
export const deletarInfraestruturaUrbana = async (req, res, next) => {
    try {
        const { id } = req.params;
        const infra = await InfraestruturaUrbana.findByPk(id);

        if (!infra) return next(notFoundError('infraestrutura urbana', id));

        await infra.destroy();
        return res.status(204).send();
    } catch (error) {
        // Existem sensores associados a esta infraestrutura — remover primeiro
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(conflictError('Não é possível apagar: existem sensores associados a esta infraestrutura'));
        return next(genericError('Erro ao deletar infraestrutura urbana'));
    }
};
