import { Notificacao, Alerta, Destinatarios } from '../models/db.config.js';
import { missingFieldsValidationError, notFoundError, sequelizeValidationError, genericError } from '../utils/error.utils.js';
import { getPagination, paginationMeta } from '../utils/pagination.utils.js';

const notifLinks = (id) => ({
    self:   { href: `/notificacoes/${id}`,  method: 'GET' },
    update: { href: `/notificacoes/${id}`,  method: 'PATCH' },
    delete: { href: `/notificacoes/${id}`,  method: 'DELETE' }
});

export const criarNotificacao = async (req, res, next) => {
    try {
        const { idalerta, iddestinatario, canal, data_envio, estado_envio, data_confirmacao, mensagem, erro_envio } = req.body;

        const missingFields = [];
        if (!idalerta) missingFields.push('idalerta');
        if (!iddestinatario) missingFields.push('iddestinatario');
        if (!canal) missingFields.push('canal');
        if (!estado_envio) missingFields.push('estado_envio');
        if (missingFields.length) return next(missingFieldsValidationError(missingFields));

        const alerta = await Alerta.findByPk(idalerta);
        if (!alerta) return next(notFoundError('alerta', idalerta));

        const destinatario = await Destinatarios.findByPk(iddestinatario);
        if (!destinatario) return next(notFoundError('destinatário', iddestinatario));

        const notificacao = await Notificacao.create({
            idalerta, iddestinatario, canal,
            data_envio: data_envio || new Date(),
            estado_envio, data_confirmacao, mensagem, erro_envio
        });

        return res.status(201).json({
            message: 'Notificação criada com sucesso',
            data: notificacao,
            links: { ...notifLinks(notificacao.idnotificacao), allNotificacoes: { href: '/notificacoes', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

export const obterNotificacoes = async (req, res, next) => {
    try {
        const { page, limit, offset } = getPagination(req.query);

        const { count, rows } = await Notificacao.findAndCountAll({
            include: [
                { model: Alerta,       attributes: ['idalerta', 'idarea_risco', 'idnivel_alerta', 'descricao', 'estado'] },
                { model: Destinatarios, attributes: ['iddestinatario', 'tipo', 'nome', 'email', 'contato'] }
            ],
            limit,
            offset
        });

        const data = rows.map(n => ({ ...n.toJSON(), links: notifLinks(n.idnotificacao) }));

        return res.status(200).json({
            data,
            pagination: paginationMeta(count, page, limit),
            links: { self: { href: '/notificacoes', method: 'GET' }, create: { href: '/notificacoes', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

export const obterNotificacaoPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notificacao = await Notificacao.findByPk(id, {
            include: [
                { model: Alerta,       attributes: ['idalerta', 'idarea_risco', 'idnivel_alerta', 'descricao', 'estado'] },
                { model: Destinatarios, attributes: ['iddestinatario', 'tipo', 'nome', 'email', 'contato'] }
            ]
        });

        if (!notificacao) return next(notFoundError('notificação', id));

        return res.status(200).json({
            data: notificacao,
            links: { ...notifLinks(id), allNotificacoes: { href: '/notificacoes', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

export const atualizarNotificacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { idalerta, iddestinatario, canal, data_envio, estado_envio, data_confirmacao, mensagem, erro_envio } = req.body;

        const notificacao = await Notificacao.findByPk(id);
        if (!notificacao) return next(notFoundError('notificação', id));

        if (idalerta !== undefined) {
            const alerta = await Alerta.findByPk(idalerta);
            if (!alerta) return next(notFoundError('alerta', idalerta));
        }
        if (iddestinatario !== undefined) {
            const destinatario = await Destinatarios.findByPk(iddestinatario);
            if (!destinatario) return next(notFoundError('destinatário', iddestinatario));
        }

        const updateData = {};
        if (idalerta !== undefined) updateData.idalerta = idalerta;
        if (iddestinatario !== undefined) updateData.iddestinatario = iddestinatario;
        if (canal !== undefined) updateData.canal = canal;
        if (data_envio !== undefined) updateData.data_envio = data_envio;
        if (estado_envio !== undefined) updateData.estado_envio = estado_envio;
        if (data_confirmacao !== undefined) updateData.data_confirmacao = data_confirmacao;
        if (mensagem !== undefined) updateData.mensagem = mensagem;
        if (erro_envio !== undefined) updateData.erro_envio = erro_envio;

        await notificacao.update(updateData);

        return res.status(200).json({
            message: 'Notificação atualizada com sucesso',
            data: notificacao,
            links: { ...notifLinks(id), allNotificacoes: { href: '/notificacoes', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

export const apagarNotificacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notificacao = await Notificacao.findByPk(id);

        if (!notificacao) return next(notFoundError('notificação', id));

        await notificacao.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError(error.message));
    }
};
