
import { Sensor, InfraestruturaUrbana, PrevisaoMeteorologica, LeituraSensor,AreaRisco } from "../models/db.config.js";
import { classificarAlerta } from "./classificar_alerta.utils.js";

export async function verificarAlertas(leitura) {

    

    // obter sensor + área
    const sensor = await Sensor.findByPk(leitura.idsensor, {
        include: {
            model: InfraestruturaUrbana,
            include: {
                model: AreaRisco
            }
        }
    });

    if (!sensor) {
        return null;
    }

    const areaId = sensor.infraestrutura_urbana.idarea_risco;
    const infraestruturaId = sensor.idinfraestrutura_urbana;



    // obter previsão mais recente dessa área
    const previsao = await PrevisaoMeteorologica.findOne({
        where: { idarea_risco: areaId },
        order: [["data_emissao", "DESC"]]
    });


    const forecast1h = Number(previsao?.precipitacao_prevista_mm || 0);


    // calcular chuva últimas 6 leituras
    const ultimas = await LeituraSensor.findAll({
        where: { idsensor: leitura.idsensor },
        order: [["data_observacao", "DESC"]],
        limit: 6
    });

    const rain6h = ultimas.reduce((sum, l) => sum + Number(l.valor), 0);

    // valor da leitura atual
    const water = Number(leitura.valor);

    //  classificar alerta

    const resultado = classificarAlerta({
        water,
        rain6h,
        forecast1h
    });

    const nivel = resultado.idnivel_alerta;
    const score = resultado.score_risco;
    const razoes = resultado.razoes;
    console.log(`razões: ${razoes.join("; ")}`);

   

    // ignorar se verde
   //if (nivel === 1) return null;

    // criar objeto alerta
    return {
        nivel,
        idarea_risco: areaId,
        idinfraestrutura_urbana: infraestruturaId,
        idleitura_sensor: leitura.idleitura_sensor,
        valor_sensor: water,
        precipitacao_prevista: forecast1h,
        precipitacao_acumulada: rain6h,
        score_risco: score,

        mensagem: `Alerta nível ${nivel} : ${razoes.join("; ")}`
    };
}
