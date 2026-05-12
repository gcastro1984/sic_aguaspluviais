import {
    Alerta,
    NivelAlerta,
    Sensor
} from '../models/db.config.js';

import { classificarRisco } from './classificar.utils.js';



// VERIFICAR E GERAR ALERTAS


export const verificarAlertas = async (leitura) => {

    // ==================================================
    // VALIDAR SENSOR
    // ==================================================

    const sensor = await Sensor.findByPk(leitura.sensorId);
    console.log("Sensor encontrado:", sensor ? sensor.toJSON() : null);
  
    
  

    if (!sensor) {
        throw new Error("Sensor não encontrado");
    }

  
    // DADOS PARA CLASSIFICAÇÃO
   

    // 
    // Idealmente vêm de sensores reais/API meteorológica

    const dadosClassificacao = {

        // valor do sensor de água
        nivelAgua: leitura.leitura,
        

        // simulação previsão chuva
        precipitacaoPrevista: leitura.precipitacaoPrevista || 0,

        // simulação acumulada
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
        throw new Error(
            `NivelAlerta '${resultado.nivel}' não encontrado`
        );
    }

    
    // EVITAR ALERTAS DUPLICADOS
  
    const ultimoAlerta = await Alerta.findOne({
        where: {
            sensorId: leitura.sensorId
        },
        order: [['createdAt', 'DESC']]
    });

    if (
        ultimoAlerta &&
        ultimoAlerta.nivelAlertaId === nivelAlerta.id
    ) {

        return {
            classificacao: resultado,
            alerta: ultimoAlerta,
            repetido: true
        };
    }

    // CRIAR ALERTA
  

    const alerta = await Alerta.create({

        descricao:
            `Alerta ${resultado.nivel} - ` +
            `Nível água: ${dadosClassificacao.nivelAgua}%`,

         leituraSensorId: leitura.id,

        nivelAlertaId: nivel.id
    });


    return {
        classificacao: resultado,
        alerta
    };
};