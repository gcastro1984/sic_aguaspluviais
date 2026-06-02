import { PlanoAcao } from '../models/db.config.js';
import { missingFieldsValidationError, validationError, sequelizeValidationError, notFoundError, genericError, conflictError } from '../utils/error.utils.js';

// Tipos de destinatário aceites — determina quem recebe notificações do plano
const TIPOS_DESTINATARIO_VALIDOS = ['tecnico', 'responsavel', 'cidadao', 'autoridade'];

// Links HATEOAS — acções disponíveis para um plano de ação específico
const planoLinks = (id) => ({
    self:   { href: `/planos-acao/${id}`, method: 'GET' },
    update: { href: `/planos-acao/${id}`, method: 'PATCH' },
    delete: { href: `/planos-acao/${id}`, method: 'DELETE' }
});

// POST /planos-acao — cria um novo plano de ação
export const criarPlanoAcao = async (req, res, next) => {
    try {
        const { descricao, tipo_destinatario } = req.body;

        if (!descricao || !tipo_destinatario)
            return next(missingFieldsValidationError(['descricao', 'tipo_destinatario']));

        if (!TIPOS_DESTINATARIO_VALIDOS.includes(tipo_destinatario))
            return next(validationError({ tipo_destinatario: `Tipo inválido. Use: ${TIPOS_DESTINATARIO_VALIDOS.join(', ')}` }));

        const planoAcao = await PlanoAcao.create({ descricao, tipo_destinatario });

        return res.status(201).json({
            _self: `/planos-acao/${planoAcao.idplano_acao}`
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError('Erro ao criar plano de ação'));
    }
};

// GET /planos-acao — lista todos os planos com paginação
export const obterPlanosAcao = async (req, res, next) => {
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

        const { count, rows } = await PlanoAcao.findAndCountAll({ limit, offset });

        const data  = rows.map(p => ({ ...p.toJSON(), _links: planoLinks(p.idplano_acao) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/planos-acao', method: 'GET' }, create: { href: '/planos-acao', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter planos de ação'));
    }
};

// GET /planos-acao/:id — devolve um plano específico pelo ID
export const obterPlanoAcaoPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const planoAcao = await PlanoAcao.findByPk(id);

        if (!planoAcao) return next(notFoundError('plano_acao', id));

        return res.status(200).json({
            ...planoAcao.toJSON(),
            _links: { ...planoLinks(id), allPlanosAcao: { href: '/planos-acao', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError('Erro ao obter plano de ação'));
    }
};

// PATCH /planos-acao/:id — actualização parcial (só os campos enviados são alterados)
export const atualizarPlanoAcao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { descricao, tipo_destinatario } = req.body;

        const planoAcao = await PlanoAcao.findByPk(id);
        if (!planoAcao) return next(notFoundError('plano_acao', id));

        if (tipo_destinatario !== undefined && !TIPOS_DESTINATARIO_VALIDOS.includes(tipo_destinatario))
            return next(validationError({ tipo_destinatario: `Tipo inválido. Use: ${TIPOS_DESTINATARIO_VALIDOS.join(', ')}` }));

        const updateData = {};
        if (descricao !== undefined) updateData.descricao = descricao;
        if (tipo_destinatario !== undefined) updateData.tipo_destinatario = tipo_destinatario;

        await planoAcao.update(updateData);

        return res.status(200).json({
            message: 'Plano de ação atualizado com sucesso',
            ...planoAcao.toJSON(),
            _links: { ...planoLinks(id), allPlanosAcao: { href: '/planos-acao', method: 'GET' } }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') return next(sequelizeValidationError(error.errors));
        return next(genericError('Erro ao atualizar plano de ação'));
    }
};

// DELETE /planos-acao/:id — apaga o plano
// ATENÇÃO — SEM onDelete:CASCADE para plano_alerta: bloqueia se estiver configurado em níveis de alerta
export const apagarPlanoAcao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const planoAcao = await PlanoAcao.findByPk(id);

        if (!planoAcao) return next(notFoundError('plano_acao', id));

        await planoAcao.destroy();
        return res.status(204).send();
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError')
            return next(conflictError('Não é possível apagar: este plano de ação está associado a níveis de alerta'));
        return next(genericError('Erro ao apagar plano de ação'));
    }
};
