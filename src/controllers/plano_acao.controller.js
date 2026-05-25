import { PlanoAcao } from '../models/db.config.js';
import { missingFieldsValidationError, sequelizeValidationError, notFoundError, genericError } from '../utils/error.utils.js';
import { getPagination, paginationMeta } from '../utils/pagination.utils.js';

const planoLinks = (id) => ({
    self:   { href: `/planos-acao/${id}`,  method: 'GET' },
    update: { href: `/planos-acao/${id}`,  method: 'PATCH' },
    delete: { href: `/planos-acao/${id}`,  method: 'DELETE' }
});

export const criarPlanoAcao = async (req, res, next) => {
    try {
        const { descricao, tipo_destinatario } = req.body;

        if (!descricao || !tipo_destinatario)
            return next(missingFieldsValidationError(['descricao', 'tipo_destinatario']));

        const planoAcao = await PlanoAcao.create({ descricao, tipo_destinatario });

        return res.status(201).json({
            message: 'Plano de ação criado com sucesso',
            data: planoAcao,
            links: { ...planoLinks(planoAcao.idplano_acao), allPlanosAcao: { href: '/planos-acao', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError('Erro ao criar plano de ação'));
    }
};

export const obterPlanosAcao = async (req, res, next) => {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const { count, rows } = await PlanoAcao.findAndCountAll({ limit, offset });

        const data = rows.map(p => ({ ...p.toJSON(), links: planoLinks(p.idplano_acao) }));

        return res.status(200).json({
            data,
            pagination: paginationMeta(count, page, limit),
            links: { self: { href: '/planos-acao', method: 'GET' }, create: { href: '/planos-acao', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter planos de ação'));
    }
};

export const obterPlanoAcaoPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const planoAcao = await PlanoAcao.findByPk(id);

        if (!planoAcao) return next(notFoundError('plano_acao', id));

        return res.status(200).json({
            data: planoAcao,
            links: { ...planoLinks(id), allPlanosAcao: { href: '/planos-acao', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter plano de ação'));
    }
};

export const atualizarPlanoAcao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { descricao, tipo_destinatario } = req.body;

        const planoAcao = await PlanoAcao.findByPk(id);
        if (!planoAcao) return next(notFoundError('plano_acao', id));

        const updateData = {};
        if (descricao !== undefined) updateData.descricao = descricao;
        if (tipo_destinatario !== undefined) updateData.tipo_destinatario = tipo_destinatario;

        await planoAcao.update(updateData);

        return res.status(200).json({
            message: 'Plano de ação atualizado com sucesso',
            data: planoAcao,
            links: { ...planoLinks(id), allPlanosAcao: { href: '/planos-acao', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError('Erro ao atualizar plano de ação'));
    }
};

export const apagarPlanoAcao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const planoAcao = await PlanoAcao.findByPk(id);

        if (!planoAcao) return next(notFoundError('plano_acao', id));

        await planoAcao.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError('Erro ao apagar plano de ação'));
    }
};
