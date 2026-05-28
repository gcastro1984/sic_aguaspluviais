import { LeituraSensor, Sensor, Alerta, AlertaPlanoAcao, PlanoAlerta, InfraestruturaUrbana, AreaRisco, Relatorio, Utilizador } from '../models/db.config.js';
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

        // mapeamento fixo: tipo do sensor → tipo_variavel e unidades aceites
        const SENSOR_TIPO_MAP = {
            nivel_agua:   { tipo_variavel: 'nivel_agua',   unidades: ['%'] },
            precipitacao: { tipo_variavel: 'precipitacao', unidades: ['mm'] },
            caudal:       { tipo_variavel: 'caudal',       unidades: ['m3/s'] },
            temperatura:  { tipo_variavel: 'temperatura',  unidades: ['°C', 'ºC'] },
            humidade:     { tipo_variavel: 'humidade',      unidades: ['%'] },
        };

        const regra = SENSOR_TIPO_MAP[sensor.tipo];

        if (!regra)
            return next(validationError({
                tipo_variavel: `Tipo de sensor '${sensor.tipo}' não reconhecido — leitura rejeitada`
            }));

        if (tipo_variavel !== regra.tipo_variavel)
            return next(validationError({
                tipo_variavel: `Tipo inválido: o sensor #${idsensor} regista '${regra.tipo_variavel}', não '${tipo_variavel}'`
            }));

        if (!regra.unidades.includes(unidade))
            return next(validationError({
                unidade: `Unidade inválida para sensor do tipo '${sensor.tipo}'. Use: ${regra.unidades.join(', ')}`
            }));

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

            if (resultado.nivel > 1 && existente) {
                // condições agravadas ou mantidas → actualizar alerta existente
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
            // nivel === 1 (verde): não resolve automaticamente — resolução é manual pelo operador
        }

        // ── Associar planos de ação ao alerta ────────────────────────────────
        let planosAssociados = [];

        if (alertaCriado && resultado.nivel > 1) {

            // 1. Buscar planos configurados para este nível em plano_alerta
            const planosDoNivel = await PlanoAlerta.findAll({
                where: { idnivel_alerta: resultado.nivel }
            });

            if (planosDoNivel.length > 0) {

                // 2. Ignorar planos já associados (alerta pode ter sido atualizado)
                const jaAssociados = await AlertaPlanoAcao.findAll({
                    where: { idalerta: alertaCriado.idalerta },
                    attributes: ['idplano_acao']
                });
                const idsJaAssociados = new Set(jaAssociados.map(a => a.idplano_acao));

                // 3. Criar apenas os que ainda não existem
                const novos = planosDoNivel
                    .filter(p => !idsJaAssociados.has(p.idplano_acao))
                    .map(p => ({
                        idalerta:     alertaCriado.idalerta,
                        idplano_acao: p.idplano_acao,
                        estado:       'pendente',
                        responsavel:  'sistema'
                    }));

                if (novos.length > 0) {
                    for (const plano of novos) {
                        const criado = await AlertaPlanoAcao.create(plano);
                        planosAssociados.push(criado);
                    }
                    console.log(`[planos] ${planosAssociados.length} plano(s) associado(s) ao alerta ${alertaCriado.idalerta}`);
                }
            }
        }

        // ── Gerar relatório automático quando há alerta ──────────────────────
        if (alertaCriado && resultado.nivel > 1) {
            const sistemaUser = await Utilizador.findOne({ where: { tipo: 'administrador' } });
            if (sistemaUser) {
                await Relatorio.create({
                    descricao: `Relatório automático — ${resultado.mensagem}. ` +
                               `Score de risco: ${resultado.score_risco}. ` +
                               `Nível de água: ${resultado.water}%. ` +
                               `Precipitação acumulada (6h): ${resultado.rain6h}mm. ` +
                               `Previsão meteorológica: ${resultado.forecast1h}mm.`,
                    idutilizador: sistemaUser.idutilizador,
                    idalerta:     alertaCriado.idalerta
                });
                console.log(`[relatorio] Relatório automático gerado para alerta ${alertaCriado.idalerta}`);
            } else {
                console.warn('[relatorio] Nenhum utilizador administrador encontrado — relatório não gerado.');
            }
        }

        // resposta HATEOAS
        const leituraResponse = {
            ...newLeitura.toJSON(),
            classificacao: resultado ? resultado.nivel : 1,
            diagnostico: resultado ? {
                nivel:              resultado.nivel,
                score_risco:        resultado.score_risco,
                water_pct:          resultado.water,
                rain6h_mm:          resultado.rain6h,
                forecast1h_mm:      resultado.forecast1h,
                razoes:             resultado.mensagem
            } : null,
            alerta: alertaCriado ? {
                ...alertaCriado.toJSON(),
                planos_acao_ativados: planosAssociados.map(p => p.idplano_acao)
            } : null,
            _links: {
                allLeituras: { href: "/leituras",                              method: "GET"    },
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
