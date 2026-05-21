import { PlanoAcao } from '../models/db.config.js';
import { missingFieldsValidationError, validationError, sequelizeValidationError, notFoundError, genericError } from '../utils/error.utils.js';

// controller to create a new plano de ação
export const criarPlanoAcao = async (req, res, next) => {
    try {
        const { descricao, tipo_destinatario } = req.body;

        if (!descricao || !tipo_destinatario) {
            return next(missingFieldsValidationError(['descricao', 'tipo_destinatario']));
        }

        const planoAcao = await PlanoAcao.create({
            descricao,
            tipo_destinatario
        });

        const response = {
            ...planoAcao.toJSON(),
            links: {
                self: { href: `/planos-acao/${planoAcao.idplano_acao}` },
                allPlanosAcao: { href: '/planos-acao', method: 'GET' },
                update: { href: `/planos-acao/${planoAcao.idplano_acao}`, method: 'PUT' },
                delete: { href: `/planos-acao/${planoAcao.idplano_acao}`, method: 'DELETE' }
            }
        };

        return res.status(201).json({
            message: 'Plano de ação criado com sucesso',
            data: response
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(sequelizeValidationError(error.errors));
        }

        return next(genericError('Erro ao criar plano de ação'));
    }
};

// controller to get all planos de ação
export const obterPlanosAcao = async (req, res, next) => {
    try {
        const planos = await PlanoAcao.findAll();

        if (planos.length === 0) {
            return res.status(200).json({
                data: [],
                message: 'Nenhum plano de ação encontrado'
            });
        }

        const response = planos.map(plano => ({
            ...plano.toJSON(),
            links: {
                self: { href: `/planos-acao/${plano.idplano_acao}` },
                update: { href: `/planos-acao/${plano.idplano_acao}`, method: 'PUT' },
                delete: { href: `/planos-acao/${plano.idplano_acao}`, method: 'DELETE' }
            }
        }));

        return res.status(200).json({
            total: response.length,
            data: response
        });
    } catch (error) {
        return next(genericError('Erro ao obter planos de ação'));
    }
};

// controller to get plano de ação by id
export const obterPlanoAcaoPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const planoAcao = await PlanoAcao.findByPk(id);

        if (!planoAcao) {
            return next(notFoundError('plano_acao', id));
        }

        const response = {
            ...planoAcao.toJSON(),
            links: {
                self: { href: `/planos-acao/${planoAcao.idplano_acao}` },
                allPlanosAcao: { href: '/planos-acao', method: 'GET' },
                update: { href: `/planos-acao/${planoAcao.idplano_acao}`, method: 'PUT' },
                delete: { href: `/planos-acao/${planoAcao.idplano_acao}`, method: 'DELETE' }
            }
        };

        return res.status(200).json(response);
    } catch (error) {
        return next(genericError('Erro ao obter plano de ação'));
    }
};

// controller to update plano de ação
export const atualizarPlanoAcao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { descricao, tipo_destinatario } = req.body;

        const planoAcao = await PlanoAcao.findByPk(id);
        if (!planoAcao) {
            return next(notFoundError('plano_acao', id));
        }

        const updateData = {};
        if (descricao !== undefined) updateData.descricao = descricao;
        if (tipo_destinatario !== undefined) updateData.tipo_destinatario = tipo_destinatario;

        await planoAcao.update(updateData);

        const response = {
            ...planoAcao.toJSON(),
            links: {
                self: { href: `/planos-acao/${planoAcao.idplano_acao}` },
                allPlanosAcao: { href: '/planos-acao', method: 'GET' },
                delete: { href: `/planos-acao/${planoAcao.idplano_acao}`, method: 'DELETE' }
            }
        };

        return res.status(200).json({
            message: 'Plano de ação atualizado com sucesso',
            data: response
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            return next(sequelizeValidationError(error.errors));
        }

        return next(genericError('Erro ao atualizar plano de ação'));
    }
};

// controller to delete plano de ação
export const apagarPlanoAcao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const planoAcao = await PlanoAcao.findByPk(id);

        if (!planoAcao) {
            return next(notFoundError('plano_acao', id));
        }

        await planoAcao.destroy();

        return res.status(200).json({
            message: `Plano de ação com ID ${id} apagado com sucesso`,
            links: {
                allPlanosAcao: { href: '/planos-acao', method: 'GET' }
            }
        });
    } catch (error) {
        return next(genericError('Erro ao apagar plano de ação'));
    }
};
