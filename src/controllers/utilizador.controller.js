import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Utilizador } from '../models/db.config.js';
import { genericError } from '../utils/error.utils.js';
import { getPagination, paginationMeta } from '../utils/pagination.utils.js';

const userLinks = (id) => ({
    self:   { href: `/utilizadores/${id}`,  method: 'GET' },
    delete: { href: `/utilizadores/${id}`,  method: 'DELETE' }
});

// POST /utilizadores  – apenas admin pode criar utilizadores
export const criarUtilizador = async (req, res, next) => {
    try {
        const { email, password, tipo } = req.body;

        if (!email || !password || !tipo)
            return res.status(400).json({ error: 'invalid_request', error_description: 'email, password and tipo are mandatory.' });

        const tiposValidos = ['administrador', 'operador_municipal', 'analista_risco'];
        if (!tiposValidos.includes(tipo))
            return res.status(400).json({ error: 'invalid_tipo', error_description: `tipo must be one of: ${tiposValidos.join(', ')}` });

        const password_hash = await bcrypt.hash(password, 12);
        const utilizador = await Utilizador.create({ email, password_hash, tipo });

        return res.status(201).json({
            message: 'User created successfully.',
            data: { idutilizador: utilizador.idutilizador, email: utilizador.email, tipo: utilizador.tipo },
            links: { ...userLinks(utilizador.idutilizador), allUtilizadores: { href: '/utilizadores', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError')
            return res.status(409).json({ error: 'conflict', error_description: 'Email already in use.' });
        if (error.name === 'SequelizeValidationError')
            return res.status(400).json({ error: 'validation_error', errors: error.errors.map(e => e.message) });
        return next(genericError(error.message));
    }
};

// POST /utilizadores/login  – autenticação, devolve JWT
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: 'invalid_request', error_description: 'Email and password are mandatory.' });

        const user = await Utilizador.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password_hash)))
            return res.status(401).json({ error: 'invalid_credentials', error_description: 'Invalid email or password.' });

        const token = jwt.sign(
            { sub: user.idutilizador, tipo: user.tipo },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        return res.status(200).json({
            message: 'Login successful.',
            accessToken: token,
            tipo: user.tipo
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// GET /utilizadores/:id  – admin ou próprio utilizador
export const obterUtilizador = async (req, res, next) => {
    try {
        const user = await Utilizador.findByPk(req.params.id, {
            attributes: ['idutilizador', 'email', 'tipo']
        });

        if (!user) return res.status(404).json({ error: 'not_found', error_description: 'User not found.' });

        return res.status(200).json({
            data: user,
            links: { ...userLinks(req.params.id), allUtilizadores: { href: '/utilizadores', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// GET /utilizadores  – apenas admin
export const obterUtilizadores = async (req, res, next) => {
    try {
        const { page, limit, offset } = getPagination(req.query);

        const { count, rows } = await Utilizador.findAndCountAll({
            attributes: ['idutilizador', 'email', 'tipo'],
            limit,
            offset
        });

        const data = rows.map(u => ({ ...u.toJSON(), links: userLinks(u.idutilizador) }));

        return res.status(200).json({
            data,
            pagination: paginationMeta(count, page, limit),
            links: { self: { href: '/utilizadores', method: 'GET' }, create: { href: '/utilizadores', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// DELETE /utilizadores/:id  – apenas admin
export const apagarUtilizador = async (req, res, next) => {
    try {
        const deleted = await Utilizador.destroy({ where: { idutilizador: req.params.id } });
        if (!deleted) return res.status(404).json({ error: 'not_found', error_description: 'User not found.' });
        return res.status(204).send();
    } catch (error) {
        return next(genericError(error.message));
    }
};
