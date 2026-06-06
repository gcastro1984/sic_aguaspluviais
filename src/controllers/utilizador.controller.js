import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Utilizador } from '../models/db.config.js';
import { genericError, missingFieldsValidationError, validationError, conflictError, notFoundError, sequelizeValidationError, unauthorizedError, parsePagination } from '../utils/error.utils.js';

const userLinks = (id) => ({
    self:   { href: `/utilizadores/${id}`,  method: 'GET' },
    edit:   { href: `/utilizadores/${id}`,  method: 'PATCH' },
    delete: { href: `/utilizadores/${id}`,  method: 'DELETE' }
});

// POST /utilizadores  – apenas admin pode criar utilizadores
export const criarUtilizador = async (req, res, next) => {
    try {
        const { email, password, tipo } = req.body;

        if (!email || !password || !tipo)
            return next(missingFieldsValidationError(['email', 'password', 'tipo']));

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return next(validationError({ email: 'Formato de email inválido.' }));

        if (password.length < 8)
            return next(validationError({ password: 'A password deve ter pelo menos 8 caracteres.' }));

        const tiposValidos = ['administrador', 'operador_municipal', 'analista_risco'];
        if (!tiposValidos.includes(tipo))
            return next(validationError({ tipo: `Tipo inválido. Use: ${tiposValidos.join(', ')}` }));

        const password_hash = await bcrypt.hash(password, 12);
        const utilizador = await Utilizador.create({ email, password_hash, tipo });

        return res.status(201).json({
            _self: `/utilizadores/${utilizador.idutilizador}`
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError')
            return next(conflictError('Email já está em uso.'));
        if (error.name === 'SequelizeValidationError')
            return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

// POST /utilizadores/login  – autenticação, devolve access token (JWT) + refresh token (cookie)
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return next(missingFieldsValidationError(['email', 'password']));

        // Verifica se o utilizador existe e se a password corresponde ao hash guardado na BD
        const user = await Utilizador.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password_hash)))
            return next(unauthorizedError('Email ou password inválidos.'));

        // Access token: curto prazo (15m), contém id e tipo para autorização nas rotas
        const accessToken = jwt.sign(
            { sub: user.idutilizador, tipo: user.tipo },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        // Refresh token: longo prazo (1 dia), só contém o id — usado apenas para renovar o access token
        // Usa uma chave secreta diferente do access token para isolar os dois fluxos
        const refreshToken = jwt.sign(
            { sub: user.idutilizador },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '1d' }
        );

        // Persiste o refresh token na BD — permite revogar sessões individualmente no logout
        await user.update({ refresh_token: refreshToken });

        // Envia o refresh token num cookie HttpOnly: o JavaScript do browser nunca consegue lê-lo
        // (protegido contra XSS); sameSite:'lax' é suficiente para desenvolvimento local
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,    // true em produção (HTTPS)
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        // Devolve apenas o access token no body — o frontend guarda-o em memória (nunca em localStorage)
        return res.status(200).json({
            message: 'Login successful.',
            accessToken,
            tipo: user.tipo
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// POST /utilizadores/refresh  – emite novo access token a partir do refresh token (cookie)
export const refresh = async (req, res, next) => {
    try {
        // O browser envia o cookie automaticamente com credentials:'include' — o JS não tem acesso ao valor
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res.status(401).json({ error: 'no_refresh_token', error_description: 'Refresh token em falta.' });

        // Verifica se o token ainda existe na BD (não foi revogado por logout)
        const user = await Utilizador.findOne({ where: { refresh_token: refreshToken } });
        if (!user)
            return res.status(403).json({ error: 'invalid_refresh_token', error_description: 'Refresh token inválido ou revogado.' });

        // Verifica a assinatura e validade do token — lança exceção se expirado ou adulterado
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Emite um novo access token curto — o refresh token permanece o mesmo (não rotativo)
        const accessToken = jwt.sign(
            { sub: user.idutilizador, tipo: user.tipo },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        return res.status(200).json({ accessToken });
    } catch (error) {
        if (error.name === 'TokenExpiredError')
            return res.status(403).json({ error: 'refresh_token_expired', error_description: 'Refresh token expirado. Faça login novamente.' });
        if (error.name === 'JsonWebTokenError')
            return res.status(403).json({ error: 'invalid_refresh_token', error_description: 'Refresh token inválido.' });
        return next(genericError(error.message));
    }
};

// POST /utilizadores/logout  – revoga o refresh token na BD e limpa o cookie
export const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res.status(200).json({ message: 'Already disconnected.' });

        // Anula o refresh token na BD — impede que seja reutilizado mesmo antes de expirar
        await Utilizador.update({ refresh_token: null }, { where: { refresh_token: refreshToken } });

        // Remove o cookie do browser com as mesmas opções com que foi criado
        res.clearCookie('refreshToken', { httpOnly: true, secure: false, sameSite: 'lax' });
        return res.status(200).json({ message: 'Logout successful.' });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// GET /utilizadores/:id  – admin ou próprio utilizador
export const obterUtilizador = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const user = await Utilizador.findByPk(id, {
            attributes: ['idutilizador', 'email', 'tipo']
        });

        if (!user) return next(notFoundError('utilizador', id));

        return res.status(200).json({
            ...user.toJSON(),
            _links: { ...userLinks(id), allUtilizadores: { href: '/utilizadores', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// GET /utilizadores  – apenas admin
export const obterUtilizadores = async (req, res, next) => {
    try {
        const { limit, offset, page, error } = parsePagination(req);
        if (error) return next(error);

        const { count, rows } = await Utilizador.findAndCountAll({
            attributes: ['idutilizador', 'email', 'tipo'],
            limit,
            offset
        });

        const data  = rows.map(u => ({ ...u.toJSON(), _links: userLinks(u.idutilizador) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/utilizadores', method: 'GET' }, create: { href: '/utilizadores', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// PATCH /utilizadores/:id  – admin pode editar tudo; próprio utilizador só email/password
export const editarUtilizador = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const utilizador = await Utilizador.findByPk(id);
        if (!utilizador) return next(notFoundError('utilizador', id));

        const isAdmin = req.user?.tipo === 'administrador';
        const { email, password, tipo } = req.body;

        if (!email && !password && !tipo)
            return next(missingFieldsValidationError(['email', 'password', 'tipo (pelo menos um)']));

        // Utilizador não-admin não pode alterar o tipo
        if (tipo && !isAdmin)
            return next(unauthorizedError('Apenas administradores podem alterar o tipo de utilizador.'));

        const updateData = {};

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email))
                return next(validationError({ email: 'Formato de email inválido.' }));

            const emailExistente = await Utilizador.findOne({ where: { email } });
            if (emailExistente && emailExistente.idutilizador !== utilizador.idutilizador)
                return next(conflictError('Email já está em uso por outro utilizador.'));

            updateData.email = email;
        }

        if (password) {
            if (password.length < 8)
                return next(validationError({ password: 'A password deve ter pelo menos 8 caracteres.' }));
            updateData.password_hash = await bcrypt.hash(password, 12);
        }

        if (tipo) {
            const tiposValidos = ['administrador', 'operador_municipal', 'analista_risco'];
            if (!tiposValidos.includes(tipo))
                return next(validationError({ tipo: `Tipo inválido. Use: ${tiposValidos.join(', ')}` }));

            // Impedir o único admin de se rebaixar
            if (utilizador.tipo === 'administrador' && tipo !== 'administrador') {
                const totalAdmins = await Utilizador.count({ where: { tipo: 'administrador' } });
                if (totalAdmins <= 1)
                    return next(conflictError('Não é possível alterar o tipo: é o único administrador do sistema.'));
            }
            updateData.tipo = tipo;
        }

        await utilizador.update(updateData);

        return res.status(200).json({
            idutilizador: utilizador.idutilizador,
            email:        utilizador.email,
            tipo:         utilizador.tipo,
            _links:       userLinks(utilizador.idutilizador)
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError')
            return next(conflictError('Email já está em uso.'));
        if (error.name === 'SequelizeValidationError')
            return next(sequelizeValidationError(error.errors));
        return next(genericError(error.message));
    }
};

// DELETE /utilizadores/:id  – apenas admin
export const apagarUtilizador = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(validationError({ id: 'Deve ser um número inteiro positivo.' }));

        const utilizador = await Utilizador.findByPk(id);
        if (!utilizador) return next(notFoundError('utilizador', id));

        // Regra de negócio: garantir que o sistema nunca fica sem administrador
        // Se o utilizador a apagar é administrador, verificar se existe pelo menos mais um
        if (utilizador.tipo === 'administrador') {
            const totalAdmins = await Utilizador.count({ where: { tipo: 'administrador' } });
            if (totalAdmins <= 1)
                return next(conflictError('Não é possível apagar: é o único administrador do sistema. Crie outro administrador antes de apagar este.'));
        }

        // ATENÇÃO — relação SEM onDelete:CASCADE (bloqueia se existirem registos dependentes):
        //   • Relatorio → relatórios criados por este utilizador
        // Se existirem, a BD lança SequelizeForeignKeyConstraintError → devolvemos 409 Conflict
        await utilizador.destroy();
        return res.status(204).send();
    } catch (error) {
        // SequelizeForeignKeyConstraintError: o utilizador tem relatórios associados
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(conflictError('Não é possível apagar: este utilizador tem relatórios associados. Remova-os primeiro.'));
        return next(genericError(error.message));
    }
};
