import { Destinatarios } from '../models/db.config.js';
import { missingFieldsValidationError, notFoundError, sequelizeValidationError, validationError, conflictError, genericError, parsePagination } from '../utils/error.utils.js';

// Tipos de destinatário aceites — usado para filtrar quem recebe notificações automáticas
const TIPOS_VALIDOS = ['tecnico', 'responsavel', 'cidadao', 'autoridade','administrador','protecao_civil','bombeiros','policia_municipal','gestao_infraestrutura','hospital'];

// Links HATEOAS — acções disponíveis para um destinatário específico
const destLinks = (id) => ({
    self:   { href: `/destinatarios/${id}`,  method: 'GET' },
    update: { href: `/destinatarios/${id}`,  method: 'PATCH' },
    delete: { href: `/destinatarios/${id}`,  method: 'DELETE' }
});

// POST /destinatarios — cria um novo destinatário de notificações
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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return next(validationError({ email: 'Formato de email inválido.' }));

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

// GET /destinatarios — lista todos os destinatários com paginação
export const obterDestinatarios = async (req, res, next) => {
    try {
        const { limit, offset, page, error } = parsePagination(req);
        if (error) return next(error);

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

// GET /destinatarios/:id — devolve um destinatário específico pelo ID
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

// PATCH /destinatarios/:id — actualização parcial (só os campos enviados são alterados)
export const atualizarDestinatario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tipo, nome, email, contato } = req.body;

        const destinatario = await Destinatarios.findByPk(id);
        if (!destinatario) return next(notFoundError('destinatário', id));

        if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_VALIDOS.join(', ')}` }));

        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email))
                return next(validationError({ email: 'Formato de email inválido.' }));
        }

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
        if (error.name === 'SequelizeUniqueConstraintError') return next(conflictError(`Email '${req.body.email}' já está registado`));
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

        if (!TIPOS_VALIDOS.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${TIPOS_VALIDOS.join(', ')}` }));

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return next(validationError({ email: 'Formato de email inválido.' }));

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
        if (error.name === 'SequelizeUniqueConstraintError') return next(conflictError(`Email '${req.body.email}' já está registado`));
        return next(genericError(error.message));
    }
};

// DELETE /destinatarios/:id — apaga o destinatário
// ATENÇÃO — SEM onDelete:CASCADE para notificações: bloqueia se tiver notificações associadas
export const apagarDestinatario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const destinatario = await Destinatarios.findByPk(id);

        if (!destinatario) return next(notFoundError('destinatário', id));

        // ATENÇÃO — relação SEM onDelete:CASCADE (bloqueia se existirem registos dependentes):
        //   • Notificacao → notificações enviadas a este destinatário
        // Se existirem, a BD lança SequelizeForeignKeyConstraintError → devolvemos 409 Conflict
        await destinatario.destroy();
        return res.status(204).send();
    } catch (error) {
        // SequelizeForeignKeyConstraintError: o destinatário tem notificações associadas
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(conflictError('Não é possível apagar: este destinatário tem notificações associadas. Remova-as primeiro.'));
        return next(genericError(error.message));
    }
};
