import { Notificacao, Alerta, Destinatarios } from '../models/db.config.js';
import { missingFieldsValidationError, notFoundError, sequelizeValidationError, genericError } from '../utils/error.utils.js';

export const criarNotificacao = async (req, res, next) => {
    try {
        const { idalerta, iddestinatario, canal, data_envio, estado_envio, data_confirmacao, mensagem, erro_envio } = req.body;

        const missingFields = [];
        if (!idalerta) missingFields.push('idalerta');
        if (!iddestinatario) missingFields.push('iddestinatario');
        if (!canal) missingFields.push('canal');
        if (!estado_envio) missingFields.push('estado_envio');

        if (missingFields.length) {
            return next(missingFieldsValidationError(missingFields));
        }

        const alerta = await Alerta.findByPk(idalerta);
        if (!alerta) {
            return next(notFoundError('alerta', idalerta));
        }

        const destinatario = await Destinatarios.findByPk(iddestinatario);
        if (!destinatario) {
            return next(notFoundError('destinatário', iddestinatario));
        }

        const notificacao = await Notificacao.create({
            idalerta,
            iddestinatario,
            canal,
            data_envio: data_envio || new Date(),
            estado_envio,
            data_confirmacao,
            mensagem,
            erro_envio
        });

        return res.status(201).json({
            message: 'Notificação criada com sucesso',
            data: notificacao,
            links: {
                self: `/notificacoes/${notificacao.idnotificacao}`,
                allNotificacoes: '/notificacoes'
            }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(sequelizeValidationError(error.errors));
        }
        return next(genericError(error.message));
    }
};

export const obterNotificacoes = async (req, res, next) => {
    try {
        const notificacoes = await Notificacao.findAll({
            include: [
                { model: Alerta, attributes: ['idalerta', 'idarea_risco', 'idnivel_alerta', 'descricao', 'estado'] },
                { model: Destinatarios, attributes: ['iddestinatario', 'tipo', 'nome', 'email', 'contato'] }
            ]
        });

        return res.status(200).json({
            message: 'Notificações recuperadas com sucesso',
            total: notificacoes.length,
            data: notificacoes,
            links: {
                self: '/notificacoes',
                create: { method: 'POST', url: '/notificacoes' }
            }
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
                { model: Alerta, attributes: ['idalerta', 'idarea_risco', 'idnivel_alerta', 'descricao', 'estado'] },
                { model: Destinatarios, attributes: ['iddestinatario', 'tipo', 'nome', 'email', 'contato'] }
            ]
        });

        if (!notificacao) {
            return next(notFoundError('notificação', id));
        }

        return res.status(200).json({
            message: 'Notificação recuperada com sucesso',
            data: notificacao,
            links: {
                self: `/notificacoes/${notificacao.idnotificacao}`,
                allNotificacoes: '/notificacoes'
            }
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
        if (!notificacao) {
            return next(notFoundError('notificação', id));
        }

        if (idalerta !== undefined) {
            const alerta = await Alerta.findByPk(idalerta);
            if (!alerta) {
                return next(notFoundError('alerta', idalerta));
            }
        }

        if (iddestinatario !== undefined) {
            const destinatario = await Destinatarios.findByPk(iddestinatario);
            if (!destinatario) {
                return next(notFoundError('destinatário', iddestinatario));
            }
        }

        await notificacao.update({
            idalerta: idalerta !== undefined ? idalerta : notificacao.idalerta,
            iddestinatario: iddestinatario !== undefined ? iddestinatario : notificacao.iddestinatario,
            canal: canal !== undefined ? canal : notificacao.canal,
            data_envio: data_envio !== undefined ? data_envio : notificacao.data_envio,
            estado_envio: estado_envio !== undefined ? estado_envio : notificacao.estado_envio,
            data_confirmacao: data_confirmacao !== undefined ? data_confirmacao : notificacao.data_confirmacao,
            mensagem: mensagem !== undefined ? mensagem : notificacao.mensagem,
            erro_envio: erro_envio !== undefined ? erro_envio : notificacao.erro_envio
        });

        return res.status(200).json({
            message: 'Notificação atualizada com sucesso',
            data: notificacao,
            links: {
                self: `/notificacoes/${notificacao.idnotificacao}`,
                allNotificacoes: '/notificacoes'
            }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(sequelizeValidationError(error.errors));
        }
        return next(genericError(error.message));
    }
};

export const apagarNotificacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notificacao = await Notificacao.findByPk(id);

        if (!notificacao) {
            return next(notFoundError('notificação', id));
        }

        await notificacao.destroy();

        return res.status(200).json({
            message: 'Notificação apagada com sucesso',
            deletedId: id,
            links: {
                allNotificacoes: '/notificacoes',
                create: { method: 'POST', url: '/notificacoes' }
            }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};
