import { Destinatarios } from '../models/db.config.js';
import { missingFieldsValidationError, notFoundError, sequelizeValidationError, validationError, conflictError, genericError } from '../utils/error.utils.js';

const TIPOS_VALIDOS = ['tecnico', 'responsavel', 'cidadao', 'autoridade'];

const destLinks = (id) => ({
    self:    { href: `/destinatarios/${id}`,  method: 'GET' },
    replace: { href: `/destinatarios/${id}`,  method: 'PUT' },
    update:  { href: `/destinatarios/${id}`,  method: 'PATCH' },
    delete:  { href: `/destinatarios/${id}`,  method: 'DELETE' }
});

export const criarDestinatario = async (req, res, next) => {
    try {
        const { tipo, nome, email, contato } = req.body;

        const missingFields = [];
        if (!tipo) missingFields.push('tipo');
        if (!nome) missingFields.push('nome');
        if (!email) missingFields.push('email');
        if (missingFields.length) return next(missingFieldsValidationError(missingFields));

        if (!TIPOS_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_VALIDOS.join(', ')}` }));

        const destinatario = await Destinatarios.create({ tipo, nome, email, contato });

        return res.status(201).json({
            _self: `/destinatarios/${destinatario.iddestinatario}`
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        if (error.name === 'SequelizeUniqueConstraintError') return next(conflictError(`Email '${req.body.email}' já está registado`));
        return next(genericError(error.message));
    }
};

export const obterDestinatarios = async (req, res, next) => {
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

        const { count, rows } = await Destinatarios.findAndCountAll({ limit, offset });

        const data  = rows.map(d => ({ ...d.toJSON(), _links: destLinks(d.iddestinatario) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/destinatarios', method: 'GET' }, create: { href: '/destinatarios', method: 'POST' } }
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
            ...destinatario.toJSON(),
            _links: { ...destLinks(id), allDestinatarios: { href: '/destinatarios', method: 'GET' } }
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
        if (!destinatario) return next(notFoundError('destinatário', id));

        if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_VALIDOS.join(', ')}` }));

        const updateData = {};
        if (tipo !== undefined) updateData.tipo = tipo;
        if (nome !== undefined) updateData.nome = nome;
        if (email !== undefined) updateData.email = email;
        if (contato !== undefined) updateData.contato = contato;

        await destinatario.update(updateData);

        return res.status(200).json({
            message: 'Destinatário atualizado com sucesso',
            ...destinatario.toJSON(),
            _links: { ...destLinks(id), allDestinatarios: { href: '/destinatarios', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

// PUT /destinatarios/:id – substituição completa
export const substituirDestinatario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tipo, nome, email, contato } = req.body;

        const missingFields = [];
        if (!tipo) missingFields.push('tipo');
        if (!nome) missingFields.push('nome');
        if (!email) missingFields.push('email');
        if (missingFields.length) return next(missingFieldsValidationError(missingFields));

        const destinatario = await Destinatarios.findByPk(id);
        if (!destinatario) return next(notFoundError('destinatário', id));

        await destinatario.update({ tipo, nome, email, contato: contato ?? null });

        return res.status(200).json({
            message: 'Destinatário substituído com sucesso',
            ...destinatario.toJSON(),
            _links: { ...destLinks(id), allDestinatarios: { href: '/destinatarios', method: 'GET' } }
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
