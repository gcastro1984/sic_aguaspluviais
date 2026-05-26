import { LeituraSensor, Sensor, Alerta, InfraestruturaUrbana, AreaRisco } from '../models/db.config.js';
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from "../utils/error.utils.js";
import { verificarAlertas } from '../utils/alerta.utils.js';

const QUALIDADES_VALIDAS   = ['boa', 'suspeita'];
const TIPO_VARIAVEL_VALIDOS = ['nivel_agua', 'precipitacao', 'caudal', 'temperatura', 'humidade'];

const leituraLinks = (id) => ({
    self:   { href: `/leituras/${id}`, method: 'GET' },
    delete: { href: `/leituras/${id}`, method: 'DELETE' }
});

// GET /leituras?idsensor=1&page=1&limit=20
export const obterLeituras = async (req, res, next) => {
    try {
        const { idsensor } = req.query;
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
        if (idsensor) where.idsensor = parseInt(idsensor);

        const { count, rows } = await LeituraSensor.findAndCountAll({ where, limit, offset, order: [['data_registo', 'DESC']] });

        const data  = rows.map(l => ({ ...l.toJSON(), _links: leituraLinks(l.idleitura_sensor) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: { self: { href: '/leituras', method: 'GET' }, create: { href: '/leituras', method: 'POST' } }
        });
    } catch (error) {
        return next(genericError(error.message));
    }
};


export const criarLeitura = async (req, res, next) => {
    try {
        const { idsensor, tipo_variavel, valor, unidade, data_observacao, qualidade_dado } = req.body;

        // Validar campos obrigatórios
        const missingFields = [];
        if (!idsensor)        missingFields.push('idsensor');
        if (!tipo_variavel)   missingFields.push('tipo_variavel');
        if (valor === undefined || valor === null) missingFields.push('valor');
        if (!unidade)         missingFields.push('unidade');
        if (!data_observacao) missingFields.push('data_observacao');
        if (missingFields.length) return next(missingFieldsValidationError(missingFields));

        if (!TIPO_VARIAVEL_VALIDOS.includes(tipo_variavel))
            return next(validationError({ tipo_variavel: `Tipo inválido. Use: ${TIPO_VARIAVEL_VALIDOS.join(', ')}` }));

        if (Number(valor) < 0)
            return next(validationError({ valor: 'O valor não pode ser negativo' }));

        const dataObs = new Date(data_observacao);
        if (isNaN(dataObs.getTime()))
            return next(validationError({ data_observacao: 'Data de observação inválida' }));
        if (dataObs > new Date())
            return next(validationError({ data_observacao: 'A data de observação não pode ser no futuro' }));

        if (qualidade_dado !== undefined && !QUALIDADES_VALIDAS.includes(qualidade_dado))
            return next(validationError({ qualidade_dado: `Qualidade inválida. Use: ${QUALIDADES_VALIDAS.join(', ')}` }));

        // validar sensor ANTES de criar leitura
        const sensor = await Sensor.findByPk(idsensor);

        if (!sensor) {
            return next(notFoundError('sensor', idsensor));
        }
        if (sensor.status !== 'online') {
            return next(conflictError("Sensor está offline ou em manutenção"));
        }

        // sequelize valida automaticamente
        const newLeitura = await LeituraSensor.create(req.body);

        // verificar/classificar alertas
        const resultado = await verificarAlertas(newLeitura);
        console.log("Resultado da verificação de alertas:", resultado);

        let alertaCriado = null;

        // só processa alertas se o sensor tem infraestrutura e área de risco associadas
        if (resultado) {
            const existente = await Alerta.findOne({
                where: { idarea_risco: resultado.idarea_risco, estado: "ativo" }
            });
            console.log("Alerta existente encontrado:", existente);

            if (resultado.nivel === 1 && existente) {
                // nível verde → resolve alerta ativo existente
                await existente.update({ estado: "resolvido" });
            } else if (existente) {
                // já existe alerta ativo → atualizar
                console.log("Alerta já existe, a atualizar");
                await existente.update({
                    idnivel_alerta: resultado.nivel,
                    descricao: resultado.mensagem,
                    score_risco: resultado.score_risco || 0,
                    idleitura_sensor: newLeitura.idleitura_sensor
                });
                alertaCriado = existente;
            } else if (resultado.nivel > 1) {
                // nenhum alerta ativo e nível > verde → criar novo
                alertaCriado = await Alerta.create({
                    idnivel_alerta: resultado.nivel,
                    idarea_risco: resultado.idarea_risco,
                    idinfraestrutura_urbana: resultado.idinfraestrutura_urbana,
                    idleitura_sensor: newLeitura.idleitura_sensor,
                    descricao: resultado.mensagem,
                    score_risco: resultado.score_risco || 0,
                    estado: "ativo"
                });
            }
        }

        // resposta HATEOAS
        const leituraResponse = {
            ...newLeitura.toJSON(),
            classificacao: resultado ? resultado.nivel : 1,
            alerta: alertaCriado ? alertaCriado.toJSON() : null,
            _links: {
                allLeituras: { href: "/leituras",                         method: "GET"    },
                self:        { href: `/leituras/${newLeitura.idleitura_sensor}`, method: "GET" },
                delete:      { href: `/leituras/${newLeitura.idleitura_sensor}`, method: "DELETE" }
            }
        };
        return res.status(201).json(leituraResponse);

    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            return next(sequelizeValidationError(error.errors));
        }
        return next(genericError(error.message));
    }
};
