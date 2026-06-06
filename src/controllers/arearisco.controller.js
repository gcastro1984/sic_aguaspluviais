import { AreaRisco } from '../models/db.config.js';
import { validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError, conflictError, parsePagination } from '../utils/error.utils.js';

// Links HATEOAS — acções disponíveis para uma área de risco específica
const areaLinks = (id) => ({
    self:   { href: `/areas-risco/${id}`, method: 'GET' },
    update: { href: `/areas-risco/${id}`, method: 'PATCH' },
    delete: { href: `/areas-risco/${id}`, method: 'DELETE' }
});

// POST /areas-risco — cria uma nova área de risco
export const criarAreaRisco = async (req, res, next) => {
    try {
        const { nome, localizacao, vulnerabilidade_base, descricao } = req.body;

        // Campos obrigatórios
        if (!nome || !localizacao || vulnerabilidade_base === undefined)
            return next(missingFieldsValidationError(['nome', 'localizacao', 'vulnerabilidade_base']));

        // Vulnerabilidade: inteiro entre 1 (baixo risco) e 5 (muito alto risco)
        if (vulnerabilidade_base < 1 || vulnerabilidade_base > 5)
            return next(validationError('vulnerabilidade_base deve estar entre 1 e 5'));

        const newAreaRisco = await AreaRisco.create({ nome, localizacao, vulnerabilidade_base, descricao: descricao || null });

        return res.status(201).json({ _self: `/areas-risco/${newAreaRisco.idarea_risco}` });
    } catch (error) {
        if (error.name === 'SequelizeValidationError')
            return next(sequelizeValidationError(error.errors));
        // Nome duplicado — campo nome é único na BD
        if (error.name === 'SequelizeUniqueConstraintError')
            return next(validationError(`Área de risco com nome '${req.body.nome}' já existe`));
        return next(genericError('Erro ao criar área de risco'));
    }
};

// GET /areas-risco?vulnerabilidade=3&page=1&limit=20 — lista áreas com paginação
// Filtro opcional: ?vulnerabilidade=1-5
export const obterAreasRisco = async (req, res, next) => {
    try {
        const { vulnerabilidade } = req.query;
        const { limit, offset, page, error } = parsePagination(req);
        if (error) return next(error);

        // Valida o filtro antes de consultar a BD
        if (vulnerabilidade !== undefined) {
            const nivel = parseInt(vulnerabilidade);
            if (isNaN(nivel) || nivel < 1 || nivel > 5)
                return next(validationError('vulnerabilidade deve estar entre 1 e 5'));
        }

        const where = vulnerabilidade ? { vulnerabilidade_base: parseInt(vulnerabilidade) } : {};
        const { count, rows } = await AreaRisco.findAndCountAll({ where, limit, offset });

        const data  = rows.map(a => ({ ...a.toJSON(), _links: areaLinks(a.idarea_risco) }));
        const pages = Math.ceil(count / limit);

        // 206 Partial Content se existem mais registos do que o limit (há mais páginas)
        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/areas-risco', method: 'GET' }, create: { href: '/areas-risco', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter áreas de risco'));
    }
};

// GET /areas-risco/:id — devolve uma área específica pelo ID
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
        return next(genericError('Erro ao obter área de risco'));
    }
};

// PATCH /areas-risco/:id — actualização parcial (só os campos enviados são alterados)
export const atualizarAreaRisco = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, localizacao, vulnerabilidade_base, descricao } = req.body;

        const area = await AreaRisco.findByPk(id);
        if (!area) return next(notFoundError('área de risco', id));

        // Valida vulnerabilidade apenas se foi enviada no body
        if (vulnerabilidade_base !== undefined && (vulnerabilidade_base < 1 || vulnerabilidade_base > 5))
            return next(validationError('vulnerabilidade_base deve estar entre 1 e 5'));

        // Constrói o objecto só com os campos a alterar
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
        if (error.name === 'SequelizeValidationError')
            return next(sequelizeValidationError(error.errors));
        if (error.name === 'SequelizeUniqueConstraintError')
            return next(validationError(`Área de risco com nome '${req.body.nome}' já existe`));
        return next(genericError('Erro ao atualizar área de risco'));
    }
};

// DELETE /areas-risco/:id — apaga a área de risco
// ATENÇÃO — SEM onDelete:CASCADE para infraestruturas: bloqueia se existirem infraestruturas associadas
// ATENÇÃO — onDelete:CASCADE activo para previsões meteorológicas: apaga-as automaticamente
export const deletarAreaRisco = async (req, res, next) => {
    try {
        const { id } = req.params;
        const area = await AreaRisco.findByPk(id);

        if (!area) return next(notFoundError('área de risco', id));

        await area.destroy();
        return res.status(204).send();
    } catch (error) {
        // Existem infraestruturas associadas a esta área — remover primeiro
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(conflictError('Não é possível apagar: existem infraestruturas associadas a esta área de risco'));
        return next(genericError('Erro ao deletar área de risco'));
    }
};
