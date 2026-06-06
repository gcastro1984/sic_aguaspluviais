import { Relatorio, Utilizador, Alerta } from '../models/db.config.js';
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError, parsePagination } from '../utils/error.utils.js';

// Links HATEOAS — acções disponíveis para um relatório específico
const relatorioLinks = (id) => ({
    self:   { href: `/relatorios/${id}`, method: 'GET' },
    update: { href: `/relatorios/${id}`, method: 'PATCH' },
    delete: { href: `/relatorios/${id}`, method: 'DELETE' }
});

// NOTA: relatórios são criados exclusivamente de forma automática pelo sistema
//       quando uma leitura gera um alerta de nível > 1 (ver leitura.controller.js)

// GET /relatorios — lista relatórios com paginação. Filtros: ?idutilizador= e ?idalerta=
// Inclui dados do utilizador e do alerta associado em cada registo
export const obterRelatorios = async (req, res, next) => {
    try {
        const { idutilizador, idalerta } = req.query;
        const { limit, offset, page, error } = parsePagination(req);
        if (error) return next(error);

        // Valida filtros como inteiros positivos
        if (idutilizador !== undefined) {
            const v = parseInt(idutilizador);
            if (isNaN(v) || v <= 0)
                return next(validationError({ idutilizador: 'Deve ser um número inteiro positivo.' }));
        }
        if (idalerta !== undefined) {
            const v = parseInt(idalerta);
            if (isNaN(v) || v <= 0)
                return next(validationError({ idalerta: 'Deve ser um número inteiro positivo.' }));
        }

        const where = {};
        if (idutilizador) where.idutilizador = parseInt(idutilizador);
        if (idalerta)     where.idalerta     = parseInt(idalerta);

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

        // Rejeita páginas fora dos limites
        if (page > pages && pages > 0)
            return next(validationError({ page: `Página ${page} não existe. Total de páginas: ${pages}.` }));

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: {
                self:   { href: '/relatorios', method: 'GET' }
            }
        });
    } catch (error) {
        next(genericError('Erro ao obter relatórios'));
    }
};

// GET /relatorios/:id — devolve um relatório específico com utilizador e alerta associados
export const obterRelatorioPorId = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

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
export const atualizarRelatorio = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const { descricao, idutilizador, idalerta } = req.body;

        // Rejeita body vazio
        if (descricao === undefined && idutilizador === undefined && idalerta === undefined)
            return next(missingFieldsValidationError(['descricao', 'idutilizador', 'idalerta (pelo menos um)']));

        // Valida IDs como inteiros positivos antes de consultar a BD
        if (idutilizador !== undefined) {
            const v = parseInt(idutilizador);
            if (isNaN(v) || v <= 0)
                return next(validationError({ idutilizador: 'Deve ser um número inteiro positivo.' }));
        }
        if (idalerta !== undefined) {
            const v = parseInt(idalerta);
            if (isNaN(v) || v <= 0)
                return next(validationError({ idalerta: 'Deve ser um número inteiro positivo.' }));
        }

        // Todas as validações passaram — consulta a BD
        const relatorio = await Relatorio.findByPk(id);
        if (!relatorio) return next(notFoundError('relatório', id));

        if (idutilizador) {
            const utilizador = await Utilizador.findByPk(parseInt(idutilizador));
            if (!utilizador) return next(notFoundError('utilizador', idutilizador));
        }

        if (idalerta) {
            const alerta = await Alerta.findByPk(parseInt(idalerta));
            if (!alerta) return next(notFoundError('alerta', idalerta));
        }

        const updateData = {};
        if (descricao !== undefined)    updateData.descricao    = descricao;
        if (idutilizador !== undefined) updateData.idutilizador = parseInt(idutilizador);
        if (idalerta !== undefined)     updateData.idalerta     = parseInt(idalerta);

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
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const relatorio = await Relatorio.findByPk(id);
        if (!relatorio) return next(notFoundError('relatório', id));

        await relatorio.destroy();
        return res.status(204).send();
    } catch (error) {
        next(genericError('Erro ao apagar relatório'));
    }
};
