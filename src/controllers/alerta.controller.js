import { Alerta, AreaRisco, NivelAlerta, PrevisaoMeteorologica, CriterioAlerta, InfraestruturaUrbana, LeituraSensor } from '../models/db.config.js';
import { verificarAlertas } from '../utils/alerta.utils.js';

// import error utils
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from "../utils/error.utils.js";

// controller to create a new alert
export const criarAlerta = async (req, res, next) => {
    try {
        const { idleitura_sensor } = req.body;

        if (!idleitura_sensor) {
            return next(missingFieldsValidationError(['idleitura_sensor']));
        }

        const leitura = await LeituraSensor.findByPk(idleitura_sensor);

        if (!leitura) {
            return next(notFoundError("Leitura não encontrada"));
        }

        // lógica de negócio
        const resultado = await verificarAlertas(leitura);

        // se não há alerta (nível verde) retorna sem criar/atualizar
        if (resultado.nivel === 1) {
            return res.status(200).json({
                message: "Sem alerta (nível verde)"
            });
        }

        // 🔍 verificar se já existe alerta ativo para a área
        const existente = await Alerta.findOne({
            where: {
                idarea_risco: resultado.idarea_risco,
                estado: "ativo"
            }
        });


if (existente) {

    // ✅ se voltou a verde → resolver alerta
    if (resultado.nivel === 1) {
        await existente.update({
            estado: "resolvido"
        });

        return res.status(200).json({
            message: "Alerta resolvido (voltou a verde)",
            alerta: existente
        });
    }

    // ✅ se nível mudou OU score mudou → atualiza
    if (
        Number(existente.idnivel_alerta) !== Number(resultado.nivel) ||
        Number(existente.score_risco) !== Number(resultado.score_risco)
    ) {
        await existente.update({
            idnivel_alerta: resultado.nivel,
            descricao: resultado.mensagem,
            score_risco: resultado.score_risco || existente.score_risco,
            idleitura_sensor: newLeitura.idleitura_sensor
        });

        return res.status(200).json({
            message: "Alerta atualizado",
            alerta: existente
        });
    }

    // ✅ se não mudou nada → ignora
    return res.status(200).json({
        message: "Já existe alerta ativo (sem alterações)",
        alerta: existente
    });
}


        // criar novo alerta
        const newAlerta = await Alerta.create({
            idnivel_alerta: resultado.nivel,
            idarea_risco: resultado.idarea_risco,
            idinfraestrutura_urbana: resultado.idinfraestrutura_urbana,
            idleitura_sensor: leitura.idleitura_sensor,
            descricao: resultado.mensagem,
            score_risco: resultado.score_risco || 0,
            estado: "ativo"
        });

        res.status(201).json(newAlerta);

    } catch (error) {
        next(genericError("Erro ao criar alerta"));
    }
};

// controller to get all alerts
export const obterAlertas = async (req, res, next) => {
    try {
        const alertas = await Alerta.findAll();

        if (alertas.length === 0) {
            return res.status(200).json({
                data: [],
                message: "Nenhum alerta encontrado"
            });
        }

        // add hateoas links to each alert
        const alertasResponse = alertas.map(alerta => ({
            ...alerta.toJSON(),
            links: {
                self: { href: `/alertas/${alerta.idalerta}` },
                update: { href: `/alertas/${alerta.idalerta}`, method: "PUT" },
                delete: { href: `/alertas/${alerta.idalerta}`, method: "DELETE" }
            }
        }));

        res.status(200).json({
            data: alertasResponse,
            total: alertasResponse.length
        });
    } catch (error) {
        next(genericError("Erro ao obter alertas"));
    }
};

// controller to get alert by id
export const obterAlertaPorId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const alerta = await Alerta.findByPk(id, {
            include: [
                {
                    model: AreaRisco,
                    include: [
                        {
                            model: PrevisaoMeteorologica,
                            attributes: [
                                'idprevisao',
                                'fonte',
                                'data_emissao',
                                'data_inicio_previsao',
                                'data_fim_previsao',
                                'horizonte_horas',
                                'precipitacao_prevista_mm',
                                'confianca'
                            ]
                        }
                    ]
                },
                {
                    model: NivelAlerta,
                    include: [
                        {
                            model: CriterioAlerta,
                            where: { ativo: true },
                            required: false
                        }
                    ]
                },
                {
                    model: InfraestruturaUrbana
                }
            ]
        });

        if (!alerta) {
            return next(notFoundError(`Alerta com ID ${id} não encontrado`));
        }

        const alertaResponse = {
            ...alerta.toJSON(),
            links: {
                allAlertas: { href: "/alertas", method: "GET" },
                update: { href: `/alertas/${alerta.idalerta}`, method: "PUT" },
                delete: { href: `/alertas/${alerta.idalerta}`, method: "DELETE" }
            }
        };

        res.status(200).json(alertaResponse);
    } catch (error) {
        next(genericError("Erro ao obter alerta"));
    }
};

// controller to update an alert
export const atualizarAlerta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { idnivel_alerta, idarea_risco, idinfraestrutura_urbana, data_alerta, descricao, score_risco, estado } = req.body;

        const alerta = await Alerta.findByPk(id);

        if (!alerta) {
            return next(notFoundError(`Alerta com ID ${id} não encontrado`));
        }

        // Validate score_risco range if provided
        if (score_risco !== undefined && (score_risco < 0 || score_risco > 100)) {
            return next(validationError('score_risco deve estar entre 0 e 100'));
        }

        // Update only provided fields
        const updateData = {};
        if (idnivel_alerta !== undefined) updateData.idnivel_alerta = idnivel_alerta;
        if (idarea_risco !== undefined) updateData.idarea_risco = idarea_risco;
        if (idinfraestrutura_urbana !== undefined) updateData.idinfraestrutura_urbana = idinfraestrutura_urbana;
        if (data_alerta !== undefined) updateData.data_alerta = data_alerta;
        if (descricao !== undefined) updateData.descricao = descricao;
        if (score_risco !== undefined) updateData.score_risco = score_risco;
        if (estado !== undefined) updateData.estado = estado;

        await alerta.update(updateData);

        // add hateoas links to the response
        const alertaResponse = {
            ...alerta.toJSON(),
            links: {
                allAlertas: { href: "/alertas", method: "GET" },
                self: { href: `/alertas/${alerta.idalerta}` },
                delete: { href: `/alertas/${alerta.idalerta}`, method: "DELETE" }
            }
        };

        res.status(200).json({
            message: "Alerta atualizado com sucesso",
            data: alertaResponse
        });
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            next(sequelizeValidationError(error.errors));
        }
        else {
            next(genericError("Erro ao atualizar alerta"));
        }
    }
};

// controller to delete an alert
export const apagarAlerta = async (req, res, next) => {
    try {
        const { id } = req.params;

        const alerta = await Alerta.findByPk(id);

        if (!alerta) {
            return next(notFoundError(`Alerta com ID ${id} não encontrado`));
        }

        await alerta.destroy();

        res.status(200).json({
            message: `Alerta com ID ${id} apagado com sucesso`,
            links: {
                allAlertas: { href: "/alertas", method: "GET" }
            }
        });
    } catch (error) {
        next(genericError("Erro ao apagar alerta"));
    }
};

// controller to get alerts by estado
export const obterAlertasPorEstado = async (req, res, next) => {
    try {
        const { estado } = req.params;

        if (!['ativo', 'resolvido', 'cancelado'].includes(estado)) {
            return next(validationError('Estado deve ser: ativo, resolvido ou cancelado'));
        }

        const alertas = await Alerta.findAll({
            where: { estado }
        });

        if (alertas.length === 0) {
            return res.status(200).json({
                data: [],
                message: `Nenhum alerta com estado '${estado}' encontrado`
            });
        }

        // add hateoas links to each alert
        const alertasResponse = alertas.map(alerta => ({
            ...alerta.toJSON(),
            links: {
                self: { href: `/alertas/${alerta.idalerta}` },
                update: { href: `/alertas/${alerta.idalerta}`, method: "PUT" },
                delete: { href: `/alertas/${alerta.idalerta}`, method: "DELETE" }
            }
        }));

        res.status(200).json({
            data: alertasResponse,
            total: alertasResponse.length,
            estado
        });
    } catch (error) {
        next(genericError("Erro ao obter alertas por estado"));
    }
};