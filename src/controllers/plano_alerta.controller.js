import { PlanoAlerta, PlanoAcao, NivelAlerta } from '../models/db.config.js';
import { missingFieldsValidationError, notFoundError, validationError, genericError } from '../utils/error.utils.js';

const paLinks = (idplano_acao, idnivel_alerta) => ({
    self:   { href: `/planos-alerta/${idplano_acao}/${idnivel_alerta}`, method: 'GET' },
    delete: { href: `/planos-alerta/${idplano_acao}/${idnivel_alerta}`, method: 'DELETE' }
});

// POST /planos-alerta
export const criarPlanoAlerta = async (req, res, next) => {
    try {
        const { idplano_acao, idnivel_alerta } = req.body;

        const missing = [];
        if (!idplano_acao)    missing.push('idplano_acao');
        if (!idnivel_alerta)  missing.push('idnivel_alerta');
        if (missing.length)   return next(missingFieldsValidationError(missing));

        // validar FKs
        const plano = await PlanoAcao.findByPk(idplano_acao);
        if (!plano) return next(notFoundError('plano_acao', idplano_acao));

        const nivel = await NivelAlerta.findByPk(idnivel_alerta);
        if (!nivel) return next(notFoundError('nivel_alerta', idnivel_alerta));

        // verificar duplicado
        const existe = await PlanoAlerta.findOne({ where: { idplano_acao, idnivel_alerta } });
        if (existe) return next(validationError({ association: 'Esta associação plano/nível já existe' }));

        await PlanoAlerta.create({ idplano_acao, idnivel_alerta });

        return res.status(201).json({
            _self: `/planos-alerta/${idplano_acao}/${idnivel_alerta}`
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// GET /planos-alerta?idnivel_alerta=2&idplano_acao=1&page=1&limit=20
export const obterPlanosAlerta = async (req, res, next) => {
    try {
        const { idnivel_alerta, idplano_acao } = req.query;
        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        let offset, page;
        if (req.query.offset !== undefined) {
            offset = Math.max(0, parseInt(req.query.offset) || 0);
            page   = Math.floor(offset / limit) + 1;
        } else {
            page   = Math.max(1, parseInt(req.query.page) || 1);
            offset = (page - 1) * limit;
        }

        const where = {};
        if (idnivel_alerta) where.idnivel_alerta = parseInt(idnivel_alerta);
        if (idplano_acao)   where.idplano_acao   = parseInt(idplano_acao);

        const { count, rows } = await PlanoAlerta.findAndCountAll({
            where,
            include: [
                { model: PlanoAcao,    attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] },
                { model: NivelAlerta,  attributes: ['idnivel_alerta', 'nome', 'cor', 'ordem_gravidade'] }
            ],
            limit,
            offset
        });

        const data  = rows.map(r => ({ ...r.toJSON(), _links: paLinks(r.idplano_acao, r.idnivel_alerta) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: {
                self:   { href: '/planos-alerta', method: 'GET' },
                create: { href: '/planos-alerta', method: 'POST' }
            }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// GET /planos-alerta/:idplano_acao/:idnivel_alerta
export const obterPlanoAlertaPorIds = async (req, res, next) => {
    try {
        const { idplano_acao, idnivel_alerta } = req.params;

        const pa = await PlanoAlerta.findOne({
            where: { idplano_acao, idnivel_alerta },
            include: [
                { model: PlanoAcao,   attributes: ['idplano_acao', 'descricao', 'tipo_destinatario'] },
                { model: NivelAlerta, attributes: ['idnivel_alerta', 'nome', 'cor', 'ordem_gravidade'] }
            ]
        });

        if (!pa) return next(notFoundError('plano_alerta', `${idplano_acao}/${idnivel_alerta}`));

        return res.status(200).json({
            ...pa.toJSON(),
            _links: { ...paLinks(idplano_acao, idnivel_alerta), allPlanosAlerta: { href: '/planos-alerta', method: 'GET' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};

// DELETE /planos-alerta/:idplano_acao/:idnivel_alerta
export const apagarPlanoAlerta = async (req, res, next) => {
    try {
        const { idplano_acao, idnivel_alerta } = req.params;

        const pa = await PlanoAlerta.findOne({ where: { idplano_acao, idnivel_alerta } });
        if (!pa) return next(notFoundError('plano_alerta', `${idplano_acao}/${idnivel_alerta}`));

        await pa.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError(error.message));
    }
};
