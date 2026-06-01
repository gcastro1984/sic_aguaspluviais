import { LeituraSensor, Sensor, Alerta, AlertaPlanoAcao, PlanoAlerta, PlanoAcao, Destinatarios, InfraestruturaUrbana, AreaRisco, Relatorio, Utilizador, Notificacao } from '../models/db.config.js';
import { conflictError, validationError, sequelizeValidationError, missingFieldsValidationError, notFoundError, genericError } from "../utils/error.utils.js";
import { verificarAlertas } from '../utils/alerta.utils.js';
import { enviarEmailAlerta } from '../utils/email.utils.js';

const QUALIDADES_VALIDAS   = ['boa', 'suspeita'];
const TIPO_VARIAVEL_VALIDOS = ['nivel_agua', 'precipitacao', 'caudal', 'temperatura', 'humidade'];

const leituraLinks = (id) => ({
    self:   { href: `/leituras/${id}`, method: 'GET' },
    delete: { href: `/leituras/${id}`, method: 'DELETE' }
});

// GET /leituras?page=1&limit=20
export const obterLeituras = async (req, res, next) => {
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

        const { count, rows } = await LeituraSensor.findAndCountAll({ limit, offset, order: [['data_registo', 'DESC']] });

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


export const obterLeiturasPorSensor = async (req, res, next) => {
    try {
        const { idsensor } = req.params;

        const sensor = await Sensor.findByPk(idsensor);
        if (!sensor) return next(notFoundError('sensor', idsensor));

        const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        let offset, page;
        if (req.query.offset !== undefined) {
            offset = Math.max(0, parseInt(req.query.offset) || 0);
            page   = Math.floor(offset / limit) + 1;
        } else {
            page   = Math.max(1, parseInt(req.query.page) || 1);
            offset = (page - 1) * limit;
        }

        const { count, rows } = await LeituraSensor.findAndCountAll({
            where: { idsensor: parseInt(idsensor) },
            limit,
            offset,
            order: [['data_registo', 'DESC']]
        });

        const data  = rows.map(l => ({ ...l.toJSON(), _links: leituraLinks(l.idleitura_sensor) }));
        const pages = Math.ceil(count / limit);

        return res.status(count > limit ? 206 : 200).json({
            data,
            pagination: { total: count, page, limit, pages },
            _links: {
                self:   { href: `/leituras/sensor/${idsensor}`, method: 'GET' },
                sensor: { href: `/sensores/${idsensor}`,        method: 'GET' }
            }
        });
    } catch (error) {
        return next(genericError('Erro ao obter leituras do sensor'));
    }
};

export const obterLeituraPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const leitura = await LeituraSensor.findByPk(id);

        if (!leitura) return next(notFoundError('leitura', id));

        return res.status(200).json({
            ...leitura.toJSON(),
            _links: {
                ...leituraLinks(id),
                allLeituras: { href: '/leituras', method: 'GET' }
            }
        });
    } catch (error) {
        return next(genericError('Erro ao obter leitura'));
    }
};

export const apagarLeitura = async (req, res, next) => {
    try {
        const { id } = req.params;
        const leitura = await LeituraSensor.findByPk(id);

        if (!leitura) return next(notFoundError('leitura', id));

        await leitura.destroy();
        return res.status(204).send();
    } catch (error) {
        return next(genericError('Erro ao apagar leitura'));
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

            // 1. Obter planos configurados para este nível em plano_alerta
            const planosDoNivel = await PlanoAlerta.findAll({
                where: { idnivel_alerta: resultado.nivel }
            });

            if (planosDoNivel.length > 0) {

                // 2. Ignorar planos já associados (alerta pode ter sido atualizado)
                const jaAssociados = await AlertaPlanoAcao.findAll({
                    where: { idalerta: alertaCriado.idalerta },
                    attributes: ['idplano_acao']
                });
                // array de IDs já associados — usado no .includes() abaixo para evitar duplicados
                const idsJaAssociados = jaAssociados.map(a => a.idplano_acao);

                // 3. Criar apenas os que ainda não existem
                const novos = planosDoNivel
                    .filter(p => !idsJaAssociados.includes(p.idplano_acao))
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

        // ── Resposta imediata ao cliente ─────────────────────────────────────
        // O envio de emails é demorado (SMTP) — respondemos ANTES de enviar
        // para evitar ECONNRESET quando o cliente aguarda demasiado tempo
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
                allLeituras: { href: '/leituras',                                method: 'GET'    },
                self:        { href: `/leituras/${newLeitura.idleitura_sensor}`, method: 'GET'    },
                delete:      { href: `/leituras/${newLeitura.idleitura_sensor}`, method: 'DELETE' }
            }
        };
        res.status(201).json(leituraResponse);

        // ── Enviar notificações por email (background) ───────────────────────
        // Corre após a resposta — não bloqueia o cliente
        // Apenas quando existe alerta activo com nível > 1 (verde)
        if (alertaCriado && resultado.nivel > 1) {
            // IIFE async: permite que o código continue sem await
            (async () => { try {
                // 1. Obter planos configurados para este nível e incluir o PlanoAcao
                //    para aceder ao tipo_destinatario de cada plano
                const planosDoNivel = await PlanoAlerta.findAll({
                    where: { idnivel_alerta: resultado.nivel },
                    include: [{ model: PlanoAcao, attributes: ['idplano_acao', 'tipo_destinatario'] }]
                });

                // 2. Extrair os tipos_destinatario únicos dos planos configurados
                //    O modelo Sequelize chama-se 'plano_acao' → chave JSON é p.plano_acao (minúsculas)
                //    .filter((tipo, index, self) => self.indexOf(tipo) === index) remove duplicados
                const tiposParaNotificar = planosDoNivel
                    .map(p => p.plano_acao?.tipo_destinatario)
                    .filter(Boolean)
                    .filter((tipo, index, self) => self.indexOf(tipo) === index);

                // 3. Obter destinatários que correspondam aos tipos dos planos
                //    NOTA: o modelo Destinatarios não tem campo 'ativo' — filtro removido
                const destinatarios = tiposParaNotificar.length > 0
                    ? await Destinatarios.findAll({ where: { tipo: tiposParaNotificar } })
                    : [];

                // 4. Obter todos os utilizadores administradores
                //    Regra: administradores recebem SEMPRE todas as notificações de alerta
                const admins = await Utilizador.findAll({ where: { tipo: 'administrador' } });

                // 5. Juntar destinatários e admins numa lista única, sem emails duplicados
                //    iddestinatario é preenchido para Destinatarios; null para admins (Utilizador)
                const listaDestinatarios = destinatarios.map(d => ({
                    email:          d.email,
                    nome:           d.nome,
                    iddestinatario: d.iddestinatario   // FK para guardar na Notificacao
                }));
                const listaAdmins = admins
                    .filter(a => a.email)
                    .map(a => ({
                        email:          a.email,
                        nome:           a.email,
                        iddestinatario: null   // admins não têm registo em Destinatarios
                    }));

                // Remove emails repetidos (caso um admin seja também destinatário)
                const todosOsDestinatarios = [...listaDestinatarios, ...listaAdmins]
                    .filter((item, index, self) => self.findIndex(x => x.email === item.email) === index);

                if (todosOsDestinatarios.length > 0) {
                    const mensagemEmail = `Alerta #${alertaCriado.idalerta} — ${resultado.mensagem}`;

                    // 6. Enviar email e guardar notificação na BD para cada destinatário
                    //    Promise.allSettled garante que uma falha não cancela os restantes envios
                    const resultadosEmail = await Promise.allSettled(
                        todosOsDestinatarios.map(dest => enviarEmailAlerta({
                            email:       dest.email,
                            nome:        dest.nome,
                            idalerta:    alertaCriado.idalerta,
                            nivel:       resultado.nivel,
                            mensagem:    resultado.mensagem,
                            score_risco: resultado.score_risco
                        }))
                    );

                    // 7. Guardar cada notificação na BD com o estado do envio
                    //    (enviado ou falhou) — para consulta no frontend
                    await Promise.allSettled(
                        todosOsDestinatarios.map((dest, i) => {
                            const sucesso = resultadosEmail[i].status === 'fulfilled';
                            return Notificacao.create({
                                idalerta:       alertaCriado.idalerta,
                                iddestinatario: dest.iddestinatario,   // null para admins
                                canal:          'email',
                                estado_envio:   sucesso ? 'enviado' : 'falhou',
                                data_envio:     new Date(),
                                mensagem:       mensagemEmail,
                                erro_envio:     sucesso ? null : resultadosEmail[i].reason?.message
                            });
                        })
                    );

                    // Log de erros individuais sem quebrar o fluxo principal
                    // (EENVELOPE = email inválido | EAUTH = credenciais inválidas — ver PDF)
                    resultadosEmail.forEach((res, i) => {
                        if (res.status === 'rejected') {
                            const code = res.reason?.code || 'UNKNOWN';
                            console.warn(`[email] Falha ao enviar para ${todosOsDestinatarios[i]?.email} — código: ${code} — ${res.reason?.message}`);
                        }
                    });

                    const enviados = resultadosEmail.filter(r => r.status === 'fulfilled').length;
                    console.log(`[email] ${enviados}/${todosOsDestinatarios.length} email(s) enviado(s) e guardados para alerta #${alertaCriado.idalerta}`);
                }
            } catch (emailErr) {
                console.error('[email] Erro inesperado no envio de notificações:', emailErr.message);
            }})(); // fim da IIFE async de background
        }

    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            return next(sequelizeValidationError(error.errors));
        }
        return next(genericError(error.message));
    }
};
