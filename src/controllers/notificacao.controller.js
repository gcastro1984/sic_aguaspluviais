import { Notificacao, Alerta, Destinatarios } from '../models/db.config.js';
import { missingFieldsValidationError, notFoundError, sequelizeValidationError, validationError, genericError } from '../utils/error.utils.js';

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

        const canaisValidos = ['email', 'sms', 'push'];
        if (!canaisValidos.includes(canal))
            return next(validationError({ canal: `Canal inválido. Use: ${canaisValidos.join(', ')}` }));

        const estadosEnvioValidos = ['pendente', 'enviado', 'falhou'];
        if (!estadosEnvioValidos.includes(estado_envio))
            return next(validationError({ estado_envio: `Estado inválido. Use: ${estadosEnvioValidos.join(', ')}` }));

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
            _self: `/notificacoes/${notificacao.idnotificacao}`
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

export const obterNotificacoes = async (req, res, next) => {
    try {
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        let offset, page;
        if (req.query.offset !== undefined) {
            offset = Math.max(0, parseInt(req.query.offset) || 0);
            page   = Math.floor(offset / limit) + 1;
        } else {
            page   = Math.max(1, parseInt(req.query.page) || 1);
            offset = (page - 1) * limit;
        }

        const { count, rows } = await Notificacao.findAndCountAll({
            include: [
                { model: Alerta,       attributes: ['idalerta', 'idarea_risco', 'idnivel_alerta', 'descricao', 'estado'] },
                { model: Destinatarios, attributes: ['iddestinatario', 'tipo', 'nome', 'email', 'contato'] }
            ],
            limit,
            offset
        });

        const data  = rows.map(n => ({ ...n.toJSON(), _links: notifLinks(n.idnotificacao) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/notificacoes', method: 'GET' }, create: { href: '/notificacoes', method: 'POST' } }
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
            ...notificacao.toJSON(),
            _links: { ...notifLinks(id), allNotificacoes: { href: '/notificacoes', method: 'GET' } }
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

        const canaisValidos = ['email', 'sms', 'push'];
        if (canal !== undefined && !canaisValidos.includes(canal))
            return next(validationError({ canal: `Canal inválido. Use: ${canaisValidos.join(', ')}` }));

        const estadosEnvioValidos = ['pendente', 'enviado', 'falhou'];
        if (estado_envio !== undefined && !estadosEnvioValidos.includes(estado_envio))
            return next(validationError({ estado_envio: `Estado inválido. Use: ${estadosEnvioValidos.join(', ')}` }));

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
            ...notificacao.toJSON(),
            _links: { ...notifLinks(id), allNotificacoes: { href: '/notificacoes', method: 'GET' } }
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
