
export function classificarAlerta({ water, rain6h, forecast1h }) {

    let waterScore = 1;
    let rainScore = 1;
    let forecastScore = 1;
    const razoes = [];

    // 🔹 Classificação individual
    if (water >= 90) {
        waterScore = 4;
        razoes.push("Nível de água >= 90%");
    } else if (water >= 85) {
        waterScore = 3;
        razoes.push("Nível de água entre 85% e 90%");
    } else if (water >= 70) {
        waterScore = 2;
        razoes.push("Nível de água entre 70% e 85%");
    }

    if (rain6h > 60) {
        rainScore = 4;
        razoes.push("Chuva > 60mm (6h)");
    } else if (rain6h >= 41) {
        rainScore = 3;
        razoes.push("Chuva 41–60mm");
    } else if (rain6h >= 30) {
        rainScore = 2;
        razoes.push("Chuva 30–40mm");
    }

    if (forecast1h > 40) {
        forecastScore = 4;
        razoes.push("Previsão > 40mm");
    } else if (forecast1h >= 21) {
        forecastScore = 3;
        razoes.push("Previsão 21–40mm");
    } else if (forecast1h >= 10) {
        forecastScore = 2;
        razoes.push("Previsão 10–20mm");
    }

    // 🔹 Score de risco (0–100)
    const score_risco = Math.min(
        100,
        Math.max(
            0,
            0.45 * water +
            0.30 * Math.min(rain6h, 80) +
            0.25 * Math.min(forecast1h, 60)
        )
    );

    // 🔹 Decisão de nível
    const scores = [waterScore, rainScore, forecastScore];
    const critical = scores.some(s => s >= 4);
    const high = scores.some(s => s >= 3);
    const moderateCount = scores.filter(s => s >= 2).length;

    let nivel = 1;

    if (critical) {
        nivel = 4;
    } else if (high || moderateCount >= 2) {
        nivel = 3;
    } else if (moderateCount >= 1) {
        nivel = 2;
    }

    return {
        idnivel_alerta: nivel,
        score_risco: Number(score_risco.toFixed(2)),
        razoes
    };
}
