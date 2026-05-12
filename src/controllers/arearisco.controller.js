import { AreaRisco } from '../models/db.config.js';

// import error utils
import { validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from "../utils/error.utils.js";

// controller to create a new area de risco
export const criarAreaRisco = async (req, res, next) => {
    try {
        const { nome, localizacao, vulnerabilidade_base, descricao } = req.body;

        // Validate required fields
        if (!nome || !localizacao || vulnerabilidade_base === undefined) {
            return next(missingFieldsValidationError(['nome', 'localizacao', 'vulnerabilidade_base']));
        }

        // Validate vulnerabilidade_base range
        if (vulnerabilidade_base < 1 || vulnerabilidade_base > 5) {
            return next(validationError('vulnerabilidade_base deve estar entre 1 e 5'));
        }

        // Create new area de risco
        const newAreaRisco = await AreaRisco.create({
            nome,
            localizacao,
            vulnerabilidade_base,
            descricao: descricao || null
        });

        // add hateoas links to the response
        const areaResponse = {
            ...newAreaRisco.toJSON(),
            links: {
                allAreas: { href: "/areasrisco", method: "GET" },
                self: { href: `/areasrisco/${newAreaRisco.idarea_risco}` },
                update: { href: `/areasrisco/${newAreaRisco.idarea_risco}`, method: "PUT" },
                delete: { href: `/areasrisco/${newAreaRisco.idarea_risco}`, method: "DELETE" }
            }
        };
        res.status(201).json(areaResponse);
    } catch (error) {
        // detect specific validation errors and send appropriate response
        if (error.name === "SequelizeValidationError") {
            next(sequelizeValidationError(error.errors));
        }
        else if (error.name === "SequelizeUniqueConstraintError") {
            next(validationError(`Área de risco com nome '${req.body.nome}' já existe`));
        }
        else {
            next(genericError("Erro ao criar área de risco"));
        }
    }
};

// controller to get all areas de risco
export const obterAreasRisco = async (req, res, next) => {
    try {
        const areas = await AreaRisco.findAll();

        if (areas.length === 0) {
            return res.status(200).json({
                data: [],
                message: "Nenhuma área de risco encontrada"
            });
        }

        // add hateoas links to each area
        const areasResponse = areas.map(area => ({
            ...area.toJSON(),
            links: {
                self: { href: `/areasrisco/${area.idarea_risco}` },
                update: { href: `/areasrisco/${area.idarea_risco}`, method: "PUT" },
                delete: { href: `/areasrisco/${area.idarea_risco}`, method: "DELETE" }
            }
        }));

        res.status(200).json({
            data: areasResponse,
            total: areasResponse.length
        });
    } catch (error) {
        next(genericError("Erro ao obter áreas de risco"));
    }
};

// controller to get area de risco by id
export const obterAreaRiscoPorId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const area = await AreaRisco.findByPk(id);

        if (!area) {
            return next(notFoundError(`Área de risco com ID ${id} não encontrada`));
        }

        // add hateoas links to the response
        const areaResponse = {
            ...area.toJSON(),
            links: {
                allAreas: { href: "/areasrisco", method: "GET" },
                update: { href: `/areasrisco/${area.idarea_risco}`, method: "PUT" },
                delete: { href: `/areasrisco/${area.idarea_risco}`, method: "DELETE" }
            }
        };

        res.status(200).json(areaResponse);
    } catch (error) {
        next(genericError("Erro ao obter área de risco"));
    }
};

// controller to update an area de risco
export const atualizarAreaRisco = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, localizacao, vulnerabilidade_base, descricao } = req.body;

        const area = await AreaRisco.findByPk(id);

        if (!area) {
            return next(notFoundError(`Área de risco com ID ${id} não encontrada`));
        }

        // Validate vulnerabilidade_base range if provided
        if (vulnerabilidade_base !== undefined && (vulnerabilidade_base < 1 || vulnerabilidade_base > 5)) {
            return next(validationError('vulnerabilidade_base deve estar entre 1 e 5'));
        }

        // Update only provided fields
        const updateData = {};
        if (nome !== undefined) updateData.nome = nome;
        if (localizacao !== undefined) updateData.localizacao = localizacao;
        if (vulnerabilidade_base !== undefined) updateData.vulnerabilidade_base = vulnerabilidade_base;
        if (descricao !== undefined) updateData.descricao = descricao;

        await area.update(updateData);

        // add hateoas links to the response
        const areaResponse = {
            ...area.toJSON(),
            links: {
                allAreas: { href: "/areasrisco", method: "GET" },
                self: { href: `/areasrisco/${area.idarea_risco}` },
                delete: { href: `/areasrisco/${area.idarea_risco}`, method: "DELETE" }
            }
        };

        res.status(200).json({
            message: "Área de risco atualizada com sucesso",
            data: areaResponse
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            next(sequelizeValidationError(error.errors));
        }
        else if (error.name === "SequelizeUniqueConstraintError") {
            next(validationError(`Área de risco com nome '${req.body.nome}' já existe`));
        }
        else {
            next(genericError("Erro ao atualizar área de risco"));
        }
    }
};

// controller to delete an area de risco
export const deletarAreaRisco = async (req, res, next) => {
    try {
        const { id } = req.params;

        const area = await AreaRisco.findByPk(id);

        if (!area) {
            return next(notFoundError(`Área de risco com ID ${id} não encontrada`));
        }

        await area.destroy();

        res.status(200).json({
            message: `Área de risco com ID ${id} deletada com sucesso`,
            links: {
                allAreas: { href: "/areasrisco", method: "GET" }
            }
        });
    } catch (error) {
        next(genericError("Erro ao deletar área de risco"));
    }
};

// controller to get areas by vulnerability level
export const obterAreasPorVulnerabilidade = async (req, res, next) => {
    try {
        const { nivel } = req.params;

        // Validate vulnerability level
        if (parseInt(nivel) < 1 || parseInt(nivel) > 5) {
            return next(validationError('Nível de vulnerabilidade deve estar entre 1 e 5'));
        }

        const areas = await AreaRisco.findAll({
            where: { vulnerabilidade_base: parseInt(nivel) }
        });

        if (areas.length === 0) {
            return res.status(200).json({
                data: [],
                message: `Nenhuma área de risco com vulnerabilidade ${nivel} encontrada`
            });
        }

        // add hateoas links to each area
        const areasResponse = areas.map(area => ({
            ...area.toJSON(),
            links: {
                self: { href: `/areasrisco/${area.idarea_risco}` },
                update: { href: `/areasrisco/${area.idarea_risco}`, method: "PUT" },
                delete: { href: `/areasrisco/${area.idarea_risco}`, method: "DELETE" }
            }
        }));

        res.status(200).json({
            data: areasResponse,
            total: areasResponse.length,
            vulnerabilidade: parseInt(nivel)
        });
    } catch (error) {
        next(genericError("Erro ao obter áreas por vulnerabilidade"));
    }
};
