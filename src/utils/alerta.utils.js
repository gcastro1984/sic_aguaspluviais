import {
    Alerta,
    NivelAlerta,
    Sensor,
    AreaRisco,
    InfraestruturaUrbana,
    CriterioAlerta,
    PrevisaoMeteorologica
} from '../models/db.config.js';

import { classificarRisco } from './classificar.utils.js';



// VERIFICAR E GERAR ALERTAS


export const verificarAlertas = async (leitura) => {

    // ==================================================
    // VALIDAR SENSOR
    // ==================================================

    const sensorId = leitura.idsensor || leitura.sensorId;
    const leituraId = leitura.idleitura_sensor || leitura.id;

    const sensor = await Sensor.findByPk(sensorId);
    console.log("Sensor encontrado:", sensor ? sensor.toJSON() : null);

    if (!sensor) {
        throw new Error("Sensor não encontrado");
    }

    const infraestrutura = sensor.idinfraestrutura_urbana
        ? await InfraestruturaUrbana.findByPk(sensor.idinfraestrutura_urbana)
        : null;

    if (!infraestrutura) {
        throw new Error("Infraestrutura urbana não encontrada para este sensor");
    }

    const areaRisco = infraestrutura.idarea_risco
        ? await AreaRisco.findByPk(infraestrutura.idarea_risco)
        : null;

    if (!areaRisco) {
        throw new Error("Área de risco não encontrada para esta infraestrutura");
    }

    const previsoesMeteorologicas = await PrevisaoMeteorologica.findAll({
        where: {
            idarea_risco: areaRisco.idarea_risco
        },
        order: [['data_emissao', 'DESC']]
    });

    // DADOS PARA CLASSIFICAÇÃO

    // Idealmente vêm de sensores reais/API meteorológica
    const dadosClassificacao = {
        nivelAgua: leitura.valor || leitura.nivelAgua || 0,
        precipitacaoPrevista: leitura.precipitacaoPrevista || 0,
        precipitacaoAcumulada: leitura.precipitacaoAcumulada || 0
    };
    console.log("Dados para classificação:", dadosClassificacao);

    // CLASSIFICAR RISCO
    const resultado = classificarRisco(dadosClassificacao);

    // NÍVEL VERDE → NÃO GERA ALERTA
    if (resultado.nivel === "Verde") {
        return {
            classificacao: resultado,
            alerta: null
        };
    }

    // PROCURAR NÍVEL ALERTA NA BD
    const nivelAlerta = await NivelAlerta.findOne({
        where: {
            nome: resultado.nivel
        }
    });

    if (!nivelAlerta) {
        throw new Error(`NivelAlerta '${resultado.nivel}' não encontrado`);
    }

    const criterios = await CriterioAlerta.findAll({
        where: {
            idnivel_alerta: nivelAlerta.idnivel_alerta,
            ativo: true
        }
    });

    // EVITAR ALERTAS DUPLICADOS
    const ultimoAlerta = await Alerta.findOne({
        where: {
            idleitura_sensor: leituraId
        },
        order: [['data_alerta', 'DESC']]
    });

    if (ultimoAlerta && ultimoAlerta.idnivel_alerta === nivelAlerta.idnivel_alerta) {
        return {
            classificacao: resultado,
            alerta: ultimoAlerta,
            repetido: true,
            criterios,
            previsoesMeteorologicas
        };
    }

    // CRIAR ALERTA
    const alerta = await Alerta.create({
        descricao: `Alerta ${resultado.nivel} - Nível água: ${dadosClassificacao.nivelAgua}%`,
        idleitura_sensor: leituraId,
        idnivel_alerta: nivelAlerta.idnivel_alerta,
        idarea_risco: areaRisco.idarea_risco,
        idinfraestrutura_urbana: infraestrutura.idinfraestrutura_urbana,
        data_alerta: new Date(),
        score_risco: resultado.score || 0,
        estado: 'ativo'
    });

    return {
        classificacao: resultado,
        alerta,
        criterios,
        previsoesMeteorologicas
    };
};