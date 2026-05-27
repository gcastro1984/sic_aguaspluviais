
import { Op } from "sequelize";
import { Sensor, InfraestruturaUrbana, PrevisaoMeteorologica, LeituraSensor, AreaRisco } from "../models/db.config.js";
import { classificarAlerta } from "./classificar_alerta.utils.js";

export async function verificarAlertas(leitura) {

    // obter sensor + infraestrutura + área de risco
    const sensor = await Sensor.findByPk(leitura.idsensor, {
        include: {
            model: InfraestruturaUrbana,
            include: { model: AreaRisco }
        }
    });

    if (!sensor) {
        console.warn(`[verificarAlertas] Sensor ${leitura.idsensor} não encontrado.`);
        return null;
    }

    if (!sensor.infraestrutura_urbana) {
        console.warn(`[verificarAlertas] Sensor ${leitura.idsensor} não tem infraestrutura associada — alerta ignorado.`);
        return null;
    }

    const areaId         = sensor.infraestrutura_urbana.idarea_risco;
    const infraestruturaId = sensor.idinfraestrutura_urbana;

    // ── 1. Nível de água (water) ──────────────────────────────────────────────
    // Só é significativo se a leitura atual for de nivel_agua.
    // Caso contrário, procura o sensor de nivel_agua mais recente da mesma infraestrutura.
    let water = 0;

    if (leitura.tipo_variavel === 'nivel_agua') {
        water = Number(leitura.valor);
    } else {
        // procurar a leitura de nivel_agua mais recente na mesma infraestrutura
        const sensoresInfra = await Sensor.findAll({
            where: { idinfraestrutura_urbana: infraestruturaId },
            attributes: ['idsensor']
        });
        const idsInfra = sensoresInfra.map(s => s.idsensor);

        if (idsInfra.length > 0) {
            const ultimaNivelAgua = await LeituraSensor.findOne({
                where: { idsensor: { [Op.in]: idsInfra }, tipo_variavel: 'nivel_agua' },
                order: [['data_observacao', 'DESC']]
            });
            water = ultimaNivelAgua ? Number(ultimaNivelAgua.valor) : 0;
        }
    }

    // ── 2. Precipitação acumulada rain6h ─────────────────────────────────────
    // Soma das últimas 6 leituras de precipitacao do sensor atual (se medir precipitacao)
    // ou de qualquer sensor de precipitacao da mesma infraestrutura.
    let rain6h = 0;

    if (leitura.tipo_variavel === 'precipitacao') {
        // o próprio sensor mede precipitação — usar as suas últimas 6 leituras
        const ultimasPrecip = await LeituraSensor.findAll({
            where: { idsensor: leitura.idsensor, tipo_variavel: 'precipitacao' },
            order: [['data_observacao', 'DESC']],
            limit: 6
        });
        rain6h = ultimasPrecip.reduce((sum, l) => sum + Number(l.valor), 0);
    } else {
        // procurar sensores de precipitação na mesma infraestrutura
        const sensoresPrecip = await Sensor.findAll({
            where: { idinfraestrutura_urbana: infraestruturaId },
            attributes: ['idsensor']
        });
        const idsPrecip = sensoresPrecip.map(s => s.idsensor);

        if (idsPrecip.length > 0) {
            const ultimasPrecip = await LeituraSensor.findAll({
                where: { idsensor: { [Op.in]: idsPrecip }, tipo_variavel: 'precipitacao' },
                order: [['data_observacao', 'DESC']],
                limit: 6
            });
            rain6h = ultimasPrecip.reduce((sum, l) => sum + Number(l.valor), 0);
        }
    }

    console.log(`[verificarAlertas] sensor=${leitura.idsensor} tipo=${leitura.tipo_variavel} water=${water} rain6h=${rain6h}`);

    // ── 3. Previsão meteorológica da área ────────────────────────────────────
    const previsao = await PrevisaoMeteorologica.findOne({
        where: { idarea_risco: areaId },
        order: [['data_emissao', 'DESC']]
    });
    const forecast1h = Number(previsao?.precipitacao_prevista_mm || 0);

    // ── 4. Classificar alerta ────────────────────────────────────────────────
    const resultado = classificarAlerta({ water, rain6h, forecast1h });

    const nivel  = resultado.idnivel_alerta;
    const score  = resultado.score_risco;
    const razoes = resultado.razoes;
    console.log(`[verificarAlertas] nível=${nivel} score=${score} razões: ${razoes.join('; ')}`);

    return {
        nivel,
        idarea_risco:            areaId,
        idinfraestrutura_urbana: infraestruturaId,
        idleitura_sensor:        leitura.idleitura_sensor,
        valor_sensor:            Number(leitura.valor),
        water,
        rain6h,
        forecast1h,
        precipitacao_prevista:   forecast1h,
        precipitacao_acumulada:  rain6h,
        score_risco:             score,
        mensagem:                `Alerta nível ${nivel} : ${razoes.join('; ')}`
    };
}
