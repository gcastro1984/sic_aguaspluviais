import { Relatorio, Utilizador, Alerta } from '../models/db.config.js';
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from '../utils/error.utils.js';

// Links HATEOAS — acções disponíveis para um relatório específico
const relatorioLinks = (id) => ({
    self:   { href: `/relatorios/${id}`, method: 'GET' },
    update: { href: `/relatorios/${id}`, method: 'PATCH' },
    delete: { href: `/relatorios/${id}`, method: 'DELETE' }
});

// POST /relatorios — cria um relatório manualmente
// NOTA: relatórios também são criados automaticamente pelo sistema quando uma leitura gera alerta de nível > 1
export const criarRelatorio = async (req, res, next) => {
    try {
        const { descricao, idutilizador, idalerta } = req.body;

        if (!descricao || !idutilizador)
            return next(missingFieldsValidationError(['descricao', 'idutilizador']));

        const utilizador = await Utilizador.findByPk(idutilizador);
        if (!utilizador) return next(notFoundError('utilizador', idutilizador));

        if (idalerta) {
            const alerta = await Alerta.findByPk(idalerta);
            if (!alerta) return next(notFoundError('alerta', idalerta));
        }

        const novoRelatorio = await Relatorio.create({ descricao, idutilizador, idalerta: idalerta || null });

        return res.status(201).json({
            _self: `/relatorios/${novoRelatorio.idrelatorio}`
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        next(genericError('Erro ao criar relatório'));
    }
};

// GET /relatorios — lista relatórios com paginação. Filtros: ?idutilizador= e ?idalerta=
// Inclui dados do utilizador e do alerta associado em cada registo
export const obterRelatorios = async (req, res, next) => {
    try {
        const { idutilizador, idalerta } = req.query;
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        let offset, page;
        if (req.query.offset !== undefined) {
            offset = Math.max(0, parseInt(req.query.offset) || 0);
            page   = Math.floor(offset / limit) + 1;
        } else {
            page   = Math.max(1, parseInt(req.query.page) || 1);
            offset = (page - 1) * limit;
        }

        const where = {};
        if (idutilizador) where.idutilizador = idutilizador;
        if (idalerta) where.idalerta = idalerta;

        const { count, rows } = await Relatorio.findAndCountAll({
            where,
            limit,
            offset,
            order: [['data', 'DESC']], // mais recentes primeiro
            include: [
                { model: Utilizador, attributes: ['idutilizador', 'email', 'tipo'] },
                { model: Alerta, attributes: ['idalerta', 'descricao', 'estado'], required: false }
            ]
        });

        const data  = rows.map(r => ({ ...r.toJSON(), _links: relatorioLinks(r.idrelatorio) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: {
                self:   { href: '/relatorios', method: 'GET' },
                create: { href: '/relatorios', method: 'POST' }
            }
        });
    } catch (error) {
        next(genericError('Erro ao obter relatórios'));
    }
};

// GET /relatorios/:id — devolve um relatório específico com utilizador e alerta associados
export const obterRelatorioPorId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const relatorio = await Relatorio.findByPk(id, {
            include: [
                { model: Utilizador, attributes: ['idutilizador', 'email', 'tipo'] },
                { model: Alerta, attributes: ['idalerta', 'descricao', 'estado'], required: false }
            ]
        });

        if (!relatorio) return next(notFoundError('relatório', id));

        return res.status(200).json({
            ...relatorio.toJSON(),
            _links: {
                ...relatorioLinks(id),
                todosRelatorios: { href: '/relatorios', method: 'GET' }
            }
        });
    } catch (error) {
        next(genericError('Erro ao obter relatório'));
    }
};

// PATCH /relatorios/:id — actualização parcial (só os campos enviados são alterados)
// Valida as FKs de utilizador e alerta se forem enviadas
export const atualizarRelatorio = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { descricao, idutilizador, idalerta } = req.body;

        const relatorio = await Relatorio.findByPk(id);
        if (!relatorio) return next(notFoundError('relatório', id));

        if (idutilizador) {
            const utilizador = await Utilizador.findByPk(idutilizador);
            if (!utilizador) return next(notFoundError('utilizador', idutilizador));
        }

        if (idalerta) {
            const alerta = await Alerta.findByPk(idalerta);
            if (!alerta) return next(notFoundError('alerta', idalerta));
        }

        const updateData = {};
        if (descricao !== undefined) updateData.descricao = descricao;
        if (idutilizador !== undefined) updateData.idutilizador = idutilizador;
        if (idalerta !== undefined) updateData.idalerta = idalerta;

        await relatorio.update(updateData);

        return res.status(200).json({
            message: 'Relatório atualizado com sucesso',
            ...relatorio.toJSON(),
            _links: {
                ...relatorioLinks(id),
                todosRelatorios: { href: '/relatorios', method: 'GET' }
            }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        next(genericError('Erro ao atualizar relatório'));
    }
};

// DELETE /relatorios/:id — apaga o relatório
export const apagarRelatorio = async (req, res, next) => {
    try {
        const { id } = req.params;

        const relatorio = await Relatorio.findByPk(id);
        if (!relatorio) return next(notFoundError('relatório', id));

        await relatorio.destroy();
        return res.status(204).send();
    } catch (error) {
        next(genericError('Erro ao apagar relatório'));
    }
};
