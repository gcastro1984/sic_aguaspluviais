import { AlertaPlanoAcao, Alerta, PlanoAcao } from '../models/db.config.js';
import { missingFieldsValidationError, notFoundError, sequelizeValidationError, validationError, genericError } from '../utils/error.utils.js';
import { getPagination, paginationMeta } from '../utils/pagination.utils.js';

const apaLinks = (idalerta, idplano) => ({
    self:   { href: `/alertas-planos/${idalerta}/${idplano}`,  method: 'GET' },
    update: { href: `/alertas-planos/${idalerta}/${idplano}`,  method: 'PATCH' },
    delete: { href: `/alertas-planos/${idalerta}/${idplano}`,  method: 'DELETE' }
});

export const criarAlertaPlanoAcao = async (req, res, next) => {
    try {
        const { idalerta, idplano_acao, estado, responsavel, data_inicio, data_conclusao, observacoes } = req.body;

        if (!idalerta || !idplano_acao || !estado || !responsavel)
            return next(missingFieldsValidationError(['idalerta', 'idplano_acao', 'estado', 'responsavel']));

        const alerta = await Alerta.findByPk(idalerta);
        if (!alerta) return next(notFoundError('alerta', idalerta));

        const planoAcao = await PlanoAcao.findByPk(idplano_acao);
        if (!planoAcao) return next(notFoundError('plano_acao', idplano_acao));

        const alertaPlanoAcao = await AlertaPlanoAcao.create({
            idalerta, idplano_acao, estado, responsavel,
            data_inicio: data_inicio || null,
            data_conclusao: data_conclusao || null,
            observacoes: observacoes || null
        });

        return res.status(201).json({
            message: 'Alerta Plano Ação criado com sucesso',
            data: alertaPlanoAcao,
            links: { ...apaLinks(idalerta, idplano_acao), allAlertasPlanos: { href: '/alertas-planos', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError')
            return next(validationError({ association: 'Esta associação de alerta e plano de ação já existe' }));
        return next(genericError('Erro ao criar alerta plano ação'));
    }
};

// GET /alertas-planos?estado=X&idalerta=1&idplano_acao=2&page=1&limit=20
export const obterAlertasPlanos = async (req, res, next) => {
    try {
        const { estado, idalerta, idplano_acao } = req.query;
        const { page, limit, offset } = getPagination(req.query);

        const where = {};
        if (estado) where.estado = estado;
        if (idalerta) where.idalerta = parseInt(idalerta);
        if (idplano_acao) where.idplano_acao = parseInt(idplano_acao);

        const { count, rows } = await AlertaPlanoAcao.findAndCountAll({
            where,
            include: [
                { model: Alerta,   attributes: ['idalerta', 'descricao', 'estado'] },
                { model: PlanoAcao, attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] }
            ],
            limit,
            offset
        });

        const data = rows.map(r => ({ ...r.toJSON(), links: apaLinks(r.idalerta, r.idplano_acao) }));

        return res.status(200).json({
            data,
            pagination: paginationMeta(count, page, limit),
            links: { self: { href: '/alertas-planos', method: 'GET' }, create: { href: '/alertas-planos', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter alertas planos ação'));
    }
};

export const obterAlertaPlanoAcaoPorIds = async (req, res, next) => {
    try {
        const { idalerta, idplano_acao } = req.params;

        const apa = await AlertaPlanoAcao.findOne({
            where: { idalerta, idplano_acao },
            include: [
                { model: Alerta,   attributes: ['idalerta', 'descricao', 'estado'] },
                { model: PlanoAcao, attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] }
            ]
        });

        if (!apa) return next(notFoundError('alerta_plano_acao', `${idalerta}/${idplano_acao}`));

        return res.status(200).json({
            data: apa,
            links: { ...apaLinks(idalerta, idplano_acao), allAlertasPlanos: { href: '/alertas-planos', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter alerta plano ação'));
    }
};

export const atualizarAlertaPlanoAcao = async (req, res, next) => {
    try {
        const { idalerta, idplano_acao } = req.params;
        const { estado, responsavel, data_inicio, data_conclusao, observacoes } = req.body;

        const apa = await AlertaPlanoAcao.findOne({ where: { idalerta, idplano_acao } });
        if (!apa) return next(notFoundError('alerta_plano_acao', `${idalerta}/${idplano_acao}`));

        const updateData = {};
        if (estado !== undefined) updateData.estado = estado;
        if (responsavel !== undefined) updateData.responsavel = responsavel;
        if (data_inicio !== undefined) updateData.data_inicio = data_inicio;
        if (data_conclusao !== undefined) updateData.data_conclusao = data_conclusao;
        if (observacoes !== undefined) updateData.observacoes = observacoes;

        await apa.update(updateData);

        return res.status(200).json({
            message: 'Alerta Plano Ação atualizado com sucesso',
            data: apa,
            links: { ...apaLinks(idalerta, idplano_acao), allAlertasPlanos: { href: '/alertas-planos', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao atualizar alerta plano ação'));
    }
};

export const deletarAlertaPlanoAcao = async (req, res, next) => {
    try {
        const { idalerta, idplano_acao } = req.params;

        const apa = await AlertaPlanoAcao.findOne({ where: { idalerta, idplano_acao } });
        if (!apa) return next(notFoundError('alerta_plano_acao', `${idalerta}/${idplano_acao}`));

        await apa.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError('Erro ao deletar alerta plano ação'));
    }
};
