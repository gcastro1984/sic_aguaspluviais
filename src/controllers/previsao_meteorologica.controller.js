import { PrevisaoMeteorologica, AreaRisco } from "../models/db.config.js";
import { missingFieldsValidationError, validationError, notFoundError, genericError } from '../utils/error.utils.js';

// CREATE - Criar nova previsão meteorológica
export const criarPrevisao = async (req, res, next) => {
    try {
        const { idarea_risco, fonte, data_emissao, data_inicio_previsao, data_fim_previsao, horizonte_horas, precipitacao_prevista_mm, confianca } = req.body;

        // Validar campos obrigatórios
        const missingFields = [];
        if (!idarea_risco) missingFields.push('idarea_risco');
        if (!fonte) missingFields.push('fonte');
        if (!data_inicio_previsao) missingFields.push('data_inicio_previsao');
        if (!data_fim_previsao) missingFields.push('data_fim_previsao');
        if (horizonte_horas === undefined) missingFields.push('horizonte_horas');
        if (precipitacao_prevista_mm === undefined) missingFields.push('precipitacao_prevista_mm');
        if (confianca === undefined) missingFields.push('confianca');

        if (missingFields.length) {
            return next(missingFieldsValidationError(missingFields));
        }

        // Validar confiança (0-1)
        if (confianca < 0 || confianca > 1) {
            return next(validationError('Confiança deve estar entre 0 e 1'));
        }

        // Verificar se área de risco existe
        const areaRisco = await AreaRisco.findByPk(idarea_risco);
        if (!areaRisco) {
            return next(notFoundError('area_risco', idarea_risco));
        }

        const previsao = await PrevisaoMeteorologica.create({
            idarea_risco,
            fonte,
            data_emissao: data_emissao || new Date(),
            data_inicio_previsao,
            data_fim_previsao,
            horizonte_horas,
            precipitacao_prevista_mm,
            confianca
        });

        return res.status(201).json({
            message: "Previsão meteorológica criada com sucesso",
            data: previsao,
            links: {
                self: `/previsoes/${previsao.idprevisao}`,
                allPrevisoes: `/previsoes`,
                update: `/previsoes/${previsao.idprevisao}`,
                delete: `/previsoes/${previsao.idprevisao}`
            }
        });
    } catch (error) {
        console.error("Erro ao criar previsão:", error);
        return next(genericError("Erro ao criar previsão meteorológica"));
    }
};

// READ - Obter todas as previsões
export const obterPrevisoes = async (req, res, next) => {
    try {
        const previsoes = await PrevisaoMeteorologica.findAll({
            include: [{ model: AreaRisco, attributes: ['idarea_risco', 'nome'] }]
        });

        return res.status(200).json({
            message: "Previsões recuperadas com sucesso",
            total: previsoes.length,
            data: previsoes,
            links: {
                self: `/previsoes`,
                create: { method: "POST", url: `/previsoes` }
            }
        });
    } catch (error) {
        console.error("Erro ao obter previsões:", error);
        return next(genericError("Erro ao obter previsões meteorológicas"));
    }
};

// READ - Obter previsão por ID
export const obterPrevisaoPorId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const previsao = await PrevisaoMeteorologica.findByPk(id, {
            include: [{ model: AreaRisco, attributes: ['idarea_risco', 'nome'] }]
        });

        if (!previsao) {
            return res.status(404).json({
                message: "Previsão meteorológica não encontrada"
            });
        }

        return res.status(200).json({
            message: "Previsão recuperada com sucesso",
            data: previsao,
            links: {
                self: `/previsoes/${previsao.idprevisao}`,
                allPrevisoes: `/previsoes`,
                update: `/previsoes/${previsao.idprevisao}`,
                delete: `/previsoes/${previsao.idprevisao}`
            }
        });
    } catch (error) {
        console.error("Erro ao obter previsão:", error);
        return next(genericError("Erro ao obter previsão meteorológica"));
    }
};

// UPDATE - Atualizar previsão
export const atualizarPrevisao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fonte, data_inicio_previsao, data_fim_previsao, horizonte_horas, precipitacao_prevista_mm, confianca } = req.body;

        const previsao = await PrevisaoMeteorologica.findByPk(id);

        if (!previsao) {
            return res.status(404).json({
                message: "Previsão meteorológica não encontrada"
            });
        }

        // Validar confiança se fornecida
        if (confianca !== undefined && (confianca < 0 || confianca > 1)) {
            return res.status(400).json({
                message: "Confiança deve estar entre 0 e 1"
            });
        }

        await previsao.update({
            fonte: fonte || previsao.fonte,
            data_inicio_previsao: data_inicio_previsao || previsao.data_inicio_previsao,
            data_fim_previsao: data_fim_previsao || previsao.data_fim_previsao,
            horizonte_horas: horizonte_horas !== undefined ? horizonte_horas : previsao.horizonte_horas,
            precipitacao_prevista_mm: precipitacao_prevista_mm !== undefined ? precipitacao_prevista_mm : previsao.precipitacao_prevista_mm,
            confianca: confianca !== undefined ? confianca : previsao.confianca
        });

        return res.status(200).json({
            message: "Previsão meteorológica atualizada com sucesso",
            data: previsao,
            links: {
                self: `/previsoes/${previsao.idprevisao}`,
                allPrevisoes: `/previsoes`
            }
        });
    } catch (error) {
        console.error("Erro ao atualizar previsão:", error);
        return next(genericError("Erro ao atualizar previsão meteorológica"));
    }
};

// DELETE - 
export const apagarPrevisao = async (req, res, next) => {
    try {
        const { id } = req.params;

        const previsao = await PrevisaoMeteorologica.findByPk(id);

        if (!previsao) {
            return res.status(404).json({
                message: "Previsão meteorológica não encontrada"
            });
        }

        await previsao.destroy();

        return res.status(200).json({
            message: "Previsão meteorológica deletada com sucesso",
            deletedId: id,
            links: {
                allPrevisoes: `/previsoes`,
                create: { method: "POST", url: `/previsoes` }
            }
        });
    } catch (error) {
        console.error("Erro ao deletar previsão:", error);
        return next(genericError("Erro ao deletar previsão meteorológica"));
    }
};

// FILTER - Obter previsões por área de risco
export const obterPrevisoesPorArea = async (req, res, next) => {
    try {
        const { idarea_risco } = req.params;

        const previsoes = await PrevisaoMeteorologica.findAll({
            where: { idarea_risco },
            include: [{ model: AreaRisco, attributes: ['idarea_risco', 'nome'] }]
        });

        if (previsoes.length === 0) {
            return res.status(404).json({
                message: "Nenhuma previsão encontrada para esta área"
            });
        }

        return res.status(200).json({
            message: "Previsões por área recuperadas com sucesso",
            total: previsoes.length,
            idarea_risco,
            data: previsoes,
            links: {
                self: `/previsoes/area/${idarea_risco}`,
                allPrevisoes: `/previsoes`
            }
        });
    } catch (error) {
        console.error("Erro ao obter previsões por área:", error);
        return next(genericError("Erro ao obter previsões por área"));
    }
};

// FILTER - Obter previsões por confiança mínima
export const obterPrevisoesPorConfianca = async (req, res, next) => {
    try {
        const { confianca_minima } = req.params;

        const confiancaNum = parseFloat(confianca_minima);
        if (isNaN(confiancaNum) || confiancaNum < 0 || confiancaNum > 1) {
            return res.status(400).json({
                message: "Confiança mínima deve estar entre 0 e 1"
            });
        }

        const previsoes = await PrevisaoMeteorologica.findAll({
            where: { confianca: { [require('sequelize').Op.gte]: confiancaNum } },
            include: [{ model: AreaRisco, attributes: ['idarea_risco', 'nome'] }]
        });

        return res.status(200).json({
            message: "Previsões com confiança mínima recuperadas com sucesso",
            total: previsoes.length,
            confianca_minima: confiancaNum,
            data: previsoes,
            links: {
                self: `/previsoes/confianca/${confianca_minima}`,
                allPrevisoes: `/previsoes`
            }
        });
    } catch (error) {
        console.error("Erro ao obter previsões por confiança:", error);
        return next(genericError("Erro ao obter previsões por confiança"));
    }
};
