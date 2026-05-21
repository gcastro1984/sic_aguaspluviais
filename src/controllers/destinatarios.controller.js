import { Destinatarios } from '../models/db.config.js';

// import error utils
import { missingFieldsValidationError, notFoundError, sequelizeValidationError, genericError } from '../utils/error.utils.js';

export const criarDestinatario = async (req, res, next) => {
    try {
        const { tipo, nome, email, contato } = req.body;

        const missingFields = [];
        if (!tipo) missingFields.push('tipo');
        if (!nome) missingFields.push('nome');
        if (!email) missingFields.push('email');

        if (missingFields.length) {
            return next(missingFieldsValidationError(missingFields));
        }

        const destinatario = await Destinatarios.create({
            tipo,
            nome,
            email,
            contato
        });

        return res.status(201).json({
            message: 'Destinatário criado com sucesso',
            data: destinatario,
            links: {
                self: `/destinatarios/${destinatario.iddestinatario}`,
                allDestinatarios: '/destinatarios'
            }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(sequelizeValidationError(error.errors));
        }
        return next(genericError(error.message));
    }
};

export const obterDestinatarios = async (req, res, next) => {
    try {
        const destinatarios = await Destinatarios.findAll();

        return res.status(200).json({
            message: 'Destinatários recuperados com sucesso',
            total: destinatarios.length,
            data: destinatarios,
            links: {
                self: '/destinatarios',
                create: { method: 'POST', url: '/destinatarios' }
            }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

export const obterDestinatarioPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const destinatario = await Destinatarios.findByPk(id);

        if (!destinatario) {
            return next(notFoundError('destinatário', id));
        }

        return res.status(200).json({
            message: 'Destinatário recuperado com sucesso',
            data: destinatario,
            links: {
                self: `/destinatarios/${destinatario.iddestinatario}`,
                allDestinatarios: '/destinatarios'
            }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

export const atualizarDestinatario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tipo, nome, email, contato } = req.body;

        const destinatario = await Destinatarios.findByPk(id);
        if (!destinatario) {
            return next(notFoundError('Destinatário', id));
        }

        await destinatario.update({
            tipo: tipo !== undefined ? tipo : destinatario.tipo,
            nome: nome !== undefined ? nome : destinatario.nome,
            email: email !== undefined ? email : destinatario.email,
            contato: contato !== undefined ? contato : destinatario.contato
        });

        return res.status(200).json({
            message: 'Destinatário atualizado com sucesso',
            data: destinatario,
            links: {
                self: `/destinatarios/${destinatario.iddestinatario}`,
                allDestinatarios: '/destinatarios'
            }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(sequelizeValidationError(error.errors));
        }
        return next(genericError(error.message));
    }
};

export const apagarDestinatario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const destinatario = await Destinatarios.findByPk(id);

        if (!destinatario) {
            return next(notFoundError('destinatário', id));
        }

        await destinatario.destroy();

        return res.status(200).json({
            message: 'Destinatário apagado com sucesso',
            deletedId: id,
            links: {
                allDestinatarios: '/destinatarios',
                create: { method: 'POST', url: '/destinatarios' }
            }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};
