

// CLASSIFICAR NÍVEL DA ÁGUA


const classificarNivelAgua = (percentagem) => {

    if (percentagem > 90) {
        console.log("percentagem", percentagem);
        return "alto";

    }

    if (percentagem >= 70) {
        return "medio";
    }

    return "baixo";
};


// CLASSIFICAR PRECIPITAÇÃO PREVISTA (1h)


const classificarPrevisaoChuva = (mm) => {

    if (mm > 40) {
        return "alto";
    }

    if (mm >= 10) {
        return "medio";
    }

    return "baixo";
};


// CLASSIFICAR PRECIPITAÇÃO ACUMULADA (6h)

const classificarChuvaAcumulada = (mm) => {

    if (mm > 60) {
        return "alto";
    }

    if (mm >= 31) {
        return "medio";
    }

    return "baixo";
};



// MATRIZ DE RISCO FINAL

export const classificarRisco = (dados) => {

    const {
        nivelAgua,
        precipitacaoPrevista,
        precipitacaoAcumulada
    } = dados;

    // classificar variáveis individualmente
    const agua = classificarNivelAgua(nivelAgua);
    const previsao = classificarPrevisaoChuva(precipitacaoPrevista);
    const acumulada = classificarChuvaAcumulada(precipitacaoAcumulada);

    // contar variáveis médias
    const variaveisMedias = [agua, previsao, acumulada]
        .filter(v => v === "medio").length;

  
    // NÍVEL 4 - VERMELHO
  
    if (agua === "alto" || previsao === "alto") {

        return {
            nivel: "Vermelho",
            gravidade: 4,
            descricao: "Emergência"
        };
    }

    // NÍVEL 3 - LARANJA

    if (variaveisMedias >= 2 || acumulada === "alto") {

        return {
            nivel: "Laranja",
            gravidade: 3,
            descricao: "Grave"
        };
    }


    // NÍVEL 2 - AMARELO


    if (variaveisMedias >= 1) {

        return {
            nivel: "Amarelo",
            gravidade: 2,
            descricao: "Moderado"
        };
    }

    // NÍVEL 1 - VERDE
   

    return {
        nivel: "Verde",
        gravidade: 1,
        descricao: "Normal"
    };
};