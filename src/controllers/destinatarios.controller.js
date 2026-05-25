import { Destinatarios } from '../models/db.config.js';
import { missingFieldsValidationError, notFoundError, sequelizeValidationError, genericError } from '../utils/error.utils.js';
import { getPagination, paginationMeta } from '../utils/pagination.utils.js';

const destLinks = (id) => ({
    self:   { href: `/destinatarios/${id}`,  method: 'GET' },
    update: { href: `/destinatarios/${id}`,  method: 'PATCH' },
    delete: { href: `/destinatarios/${id}`,  method: 'DELETE' }
});

export const criarDestinatario = async (req, res, next) => {
    try {
        const { tipo, nome, email, contato } = req.body;

        const missingFields = [];
        if (!tipo) missingFields.push('tipo');
        if (!nome) missingFields.push('nome');
        if (!email) missingFields.push('email');
        if (missingFields.length) return next(missingFieldsValidationError(missingFields));

        const destinatario = await Destinatarios.create({ tipo, nome, email, contato });

        return res.status(201).json({
            message: 'Destinatário criado com sucesso',
            data: destinatario,
            links: { ...destLinks(destinatario.iddestinatario), allDestinatarios: { href: '/destinatarios', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

export const obterDestinatarios = async (req, res, next) => {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const { count, rows } = await Destinatarios.findAndCountAll({ limit, offset });

        const data = rows.map(d => ({ ...d.toJSON(), links: destLinks(d.iddestinatario) }));

        return res.status(200).json({
            data,
            pagination: paginationMeta(count, page, limit),
            links: { self: { href: '/destinatarios', method: 'GET' }, create: { href: '/destinatarios', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

export const obterDestinatarioPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const destinatario = await Destinatarios.findByPk(id);

        if (!destinatario) return next(notFoundError('destinatário', id));

        return res.status(200).json({
            data: destinatario,
            links: { ...destLinks(id), allDestinatarios: { href: '/destinatarios', method: 'GET' } }
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
        if (!destinatario) return next(notFoundError('Destinatário', id));

        const updateData = {};
        if (tipo !== undefined) updateData.tipo = tipo;
        if (nome !== undefined) updateData.nome = nome;
        if (email !== undefined) updateData.email = email;
        if (contato !== undefined) updateData.contato = contato;

        await destinatario.update(updateData);

        return res.status(200).json({
            message: 'Destinatário atualizado com sucesso',
            data: destinatario,
            links: { ...destLinks(id), allDestinatarios: { href: '/destinatarios', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

export const apagarDestinatario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const destinatario = await Destinatarios.findByPk(id);

        if (!destinatario) return next(notFoundError('destinatário', id));

        await destinatario.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError(error.message));
    }
};
