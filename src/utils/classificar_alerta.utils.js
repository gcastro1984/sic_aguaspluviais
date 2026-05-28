
export function classificarAlerta({ water, rain6h, forecast1h, vulnerabilidade = 3 }) {

    // ── Factor de vulnerabilidade ─────────────────────────────────────────────
    // vuln 1 → fator 1.00 (limiares base)
    // vuln 3 → fator 0.90 (−10%)
    // vuln 5 → fator 0.80 (−20%)
    const fator = 1 - (vulnerabilidade - 1) * 0.05;

    // ── Limiares ajustados pela vulnerabilidade ───────────────────────────────
    const L2_water    = 70 * fator;
    const L3_water    = 85 * fator;
    const L4_water    = 90 * fator;

    const L2_rain     = 30 * fator;
    const L3_rain     = 41 * fator;
    const L4_rain     = 60 * fator;

    const L2_forecast = 10 * fator;
    const L3_forecast = 21 * fator;
    const L4_forecast = 40 * fator;

    let waterScore = 1;
    let rainScore = 1;
    let forecastScore = 1;
    const razoes = [];

    // 🔹 Classificação individual
    if (water >= L4_water) {
        waterScore = 4;
        razoes.push(`Nível de água >= ${L4_water.toFixed(1)}%`);
    } else if (water >= L3_water) {
        waterScore = 3;
        razoes.push(`Nível de água entre ${L3_water.toFixed(1)}% e ${L4_water.toFixed(1)}%`);
    } else if (water >= L2_water) {
        waterScore = 2;
        razoes.push(`Nível de água entre ${L2_water.toFixed(1)}% e ${L3_water.toFixed(1)}%`);
    }

    if (rain6h > L4_rain) {
        rainScore = 4;
        razoes.push(`Chuva > ${L4_rain.toFixed(1)}mm (6h)`);
    } else if (rain6h >= L3_rain) {
        rainScore = 3;
        razoes.push(`Chuva ${L3_rain.toFixed(1)}–${L4_rain.toFixed(1)}mm`);
    } else if (rain6h >= L2_rain) {
        rainScore = 2;
        razoes.push(`Chuva ${L2_rain.toFixed(1)}–${L3_rain.toFixed(1)}mm`);
    }

    if (forecast1h > L4_forecast) {
        forecastScore = 4;
        razoes.push(`Previsão > ${L4_forecast.toFixed(1)}mm`);
    } else if (forecast1h >= L3_forecast) {
        forecastScore = 3;
        razoes.push(`Previsão ${L3_forecast.toFixed(1)}–${L4_forecast.toFixed(1)}mm`);
    } else if (forecast1h >= L2_forecast) {
        forecastScore = 2;
        razoes.push(`Previsão ${L2_forecast.toFixed(1)}–${L3_forecast.toFixed(1)}mm`);
    }

    // 🔹 Score de risco (0–100), amplificado pela vulnerabilidade
    const scoreBase = (
        0.45 * water +
        0.30 * Math.min(rain6h, 80) +
        0.25 * Math.min(forecast1h, 60)
    );
    const scoreMult  = 1 + (vulnerabilidade - 1) * 0.05;
    const score_risco = Math.min(100, Math.max(0, scoreBase * scoreMult));

    // 🔹 Decisão de nível
    const scores = [waterScore, rainScore, forecastScore];
    const critical      = scores.some(s => s >= 4);
    const high          = scores.some(s => s >= 3);
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
        score_risco:    Number(score_risco.toFixed(2)),
        razoes
    };
}
