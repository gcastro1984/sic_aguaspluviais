import { InfraestruturaUrbana } from '../models/db.config.js';

// import error utils
import { validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from "../utils/error.utils.js";

// controller to create a new infraestrutura urbana
export const criarInfraestruturaUrbana = async (req, res, next) => {
    try {
        const { nome, tipo, localizacao, idarea_risco } = req.body;

        // Validate required fields
        if (!nome || !tipo || !localizacao || !idarea_risco) {
            return next(missingFieldsValidationError(['nome', 'tipo', 'localizacao', 'idarea_risco']));
        }

        // Create new infraestrutura urbana
        const newInfra = await InfraestruturaUrbana.create({
            nome,
            tipo,
            localizacao,
            idarea_risco
        });

        // add hateoas links to the response
        const infraResponse = {
            ...newInfra.toJSON(),
            links: {
                allInfras: { href: "/infraestruturas", method: "GET" },
                self: { href: `/infraestruturas/${newInfra.idinfraestrutura_urbana}` },
                update: { href: `/infraestruturas/${newInfra.idinfraestrutura_urbana}`, method: "PUT" },
                delete: { href: `/infraestruturas/${newInfra.idinfraestrutura_urbana}`, method: "DELETE" }
            }
        };
        res.status(201).json(infraResponse);
    } catch (error) {
        // detect specific validation errors and send appropriate response
        if (error.name === "SequelizeValidationError") {
            next(sequelizeValidationError(error.errors));
        }
        else if (error.name === "SequelizeForeignKeyConstraintError") {
            next(validationError(`Área de risco com ID ${req.body.idarea_risco} não encontrada`));
        }
        else {
            next(genericError("Erro ao criar infraestrutura urbana"));
        }
    }
};

// controller to get all infraestruturas urbanas
export const obterInfraestruturas = async (req, res, next) => {
    try {
        const infras = await InfraestruturaUrbana.findAll();

        if (infras.length === 0) {
            return res.status(200).json({
                data: [],
                message: "Nenhuma infraestrutura urbana encontrada"
            });
        }

        // add hateoas links to each infra
        const infrasResponse = infras.map(infra => ({
            ...infra.toJSON(),
            links: {
                self: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}` },
                update: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}`, method: "PUT" },
                delete: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}`, method: "DELETE" }
            }
        }));

        res.status(200).json({
            data: infrasResponse,
            total: infrasResponse.length
        });
    } catch (error) {
        next(genericError("Erro ao obter infraestruturas urbanas"));
    }
};

// controller to get infraestrutura urbana by id
export const obterInfraestruturaUrbanaId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const infra = await InfraestruturaUrbana.findByPk(id);

        if (!infra) {
            return next(notFoundError('infraestrutura urbana', id));
        }

        // add hateoas links to the response
        const infraResponse = {
            ...infra.toJSON(),
            links: {
                allInfras: { href: "/infraestruturas", method: "GET" },
                update: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}`, method: "PUT" },
                delete: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}`, method: "DELETE" }
            }
        };

        res.status(200).json(infraResponse);
    } catch (error) {
        next(genericError("Erro ao obter infraestrutura urbana"));
    }
};

// controller to update an infraestrutura urbana
export const atualizarInfraestruturaUrbana = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, tipo, localizacao, idarea_risco } = req.body;

        const infra = await InfraestruturaUrbana.findByPk(id);

        if (!infra) {
            return next(notFoundError('infraestrutura urbana', id));
        }

        // Update only provided fields
        const updateData = {};
        if (nome !== undefined) updateData.nome = nome;
        if (tipo !== undefined) updateData.tipo = tipo;
        if (localizacao !== undefined) updateData.localizacao = localizacao;
        if (idarea_risco !== undefined) updateData.idarea_risco = idarea_risco;

        await infra.update(updateData);

        // add hateoas links to the response
        const infraResponse = {
            ...infra.toJSON(),
            links: {
                allInfras: { href: "/infraestruturas", method: "GET" },
                self: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}` },
                delete: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}`, method: "DELETE" }
            }
        };

        res.status(200).json({
            message: "Infraestrutura urbana atualizada com sucesso",
            data: infraResponse
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            next(sequelizeValidationError(error.errors));
        }
        else if (error.name === "SequelizeForeignKeyConstraintError") {
            next(validationError(`Área de risco com ID ${req.body.idarea_risco} não encontrada`));
        }
        else {
            next(genericError("Erro ao atualizar infraestrutura urbana"));
        }
    }
};

// controller to delete an infraestrutura urbana
export const deletarInfraestruturaUrbana = async (req, res, next) => {
    try {
        const { id } = req.params;

        const infra = await InfraestruturaUrbana.findByPk(id);

        if (!infra) {
            return next(notFoundError('infraestrutura urbana', id));
        }

        await infra.destroy();

        res.status(200).json({
            message: `Infraestrutura urbana com ID ${id} deletada com sucesso`,
            links: {
                allInfras: { href: "/infraestruturas", method: "GET" }
            }
        });
    } catch (error) {
        next(genericError("Erro ao deletar infraestrutura urbana"));
    }
};

// controller to get infraestruturas by area de risco
export const obterInfraestruturasPorArea = async (req, res, next) => {
    try {
        const { idarea_risco } = req.params;

        const infras = await InfraestruturaUrbana.findAll({
            where: { idarea_risco: parseInt(idarea_risco) }
        });

        if (infras.length === 0) {
            return res.status(200).json({
                data: [],
                message: `Nenhuma infraestrutura urbana encontrada para a área de risco ${idarea_risco}`
            });
        }

        // add hateoas links to each infra
        const infrasResponse = infras.map(infra => ({
            ...infra.toJSON(),
            links: {
                self: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}` },
                update: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}`, method: "PUT" },
                delete: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}`, method: "DELETE" }
            }
        }));

        res.status(200).json({
            data: infrasResponse,
            total: infrasResponse.length,
            idarea_risco: parseInt(idarea_risco)
        });
    } catch (error) {
        next(genericError("Erro ao obter infraestruturas por área"));
    }
};

// controller to get infraestruturas by tipo
export const obterInfraestruturasPorTipo = async (req, res, next) => {
    try {
        const { tipo } = req.params;

        const infras = await InfraestruturaUrbana.findAll({
            where: { tipo }
        });

        if (infras.length === 0) {
            return res.status(200).json({
                data: [],
                message: `Nenhuma infraestrutura urbana do tipo '${tipo}' encontrada`
            });
        }

        // add hateoas links to each infra
        const infrasResponse = infras.map(infra => ({
            ...infra.toJSON(),
            links: {
                self: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}` },
                update: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}`, method: "PUT" },
                delete: { href: `/infraestruturas/${infra.idinfraestrutura_urbana}`, method: "DELETE" }
            }
        }));

        res.status(200).json({
            data: infrasResponse,
            total: infrasResponse.length,
            tipo
        });
    } catch (error) {
        next(genericError("Erro ao obter infraestruturas por tipo"));
    }
};
