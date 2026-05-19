#!/usr/bin/env node
'use strict';

function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let x = state;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const uniform = (rng, a, b) => a + (b - a) * rng();
const randint = (rng, a, b) => Math.floor(uniform(rng, a, b + 1));

function gaussian(rng, mean = 0, sd = 1) {
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = Math.max(rng(), Number.EPSILON);
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function mysqlDate(date) {
  const p = (x) => String(x).padStart(2, '0');
  

  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
         `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;

}

const addHours = (d, h) => new Date(d.getTime() + h * 3600000);
const addMinutes = (d, m) => new Date(d.getTime() + m * 60000);

function buildAreas() {
  return [
    {
      idarea_risco: 1,
      nome: 'Zona Ribeirinha',
      localizacao: 'Vila do Conde - Marginal e Rio Ave',
      vulnerabilidade_base: 5,
      descricao: 'Área baixa próxima do rio, sensível a maré cheia e precipitação acumulada.',
    },
    {
      idarea_risco: 2,
      nome: 'Passagem Inferior',
      localizacao: 'Vila do Conde - Acesso rodoviário inferior',
      vulnerabilidade_base: 4,
      descricao: 'Zona com histórico de acumulação rápida de água em eventos intensos.',
    },
    {
      idarea_risco: 3,
      nome: 'Centro Urbano',
      localizacao: 'Vila do Conde - Centro',
      vulnerabilidade_base: 3,
      descricao: 'Zona urbana impermeabilizada, com risco de lençóis de água.',
    },
    {
      idarea_risco: 4,
      nome: 'Zona Industrial',
      localizacao: 'Vila do Conde - Área industrial',
      vulnerabilidade_base: 2,
      descricao: 'Zona com risco moderado e dependente da capacidade de drenagem.',
    },
  ];
}

function buildInfra(areas) {
  const rows = [];
  let id = 1;
  for (const area of areas) {
    for (const [label, tipo] of [['Coletor Principal', 'coletor_pluvial'], ['Sarjeta Crítica', 'sarjeta'], ['Ponto de Drenagem', 'drenagem']]) {
      rows.push({
        idinfraestrutura_urbana: id++,
        nome: `${label} - ${area.nome}`,
        tipo,
        localizacao: area.localizacao,
        idarea_risco: area.idarea_risco,
      });
    }
  }
  return rows;
}

function buildSensors(infra, rng, start) {
  const rows = [];
  let id = 1;
  for (const item of infra) {
    for (const tipo of ['nivel_agua', 'precipitacao', 'caudal']) {
      rows.push({
        idsensor: id++,
        tipo,
        localizacao: item.localizacao,
        status: rng() > 0.04 ? 1 : 0,
        idinfraestrutura_urbana: item.idinfraestrutura_urbana,
        data_proxima_manutencao: mysqlDate(addHours(start, 24 * randint(rng, 15, 120))),
      });
    }
  }
  return rows;
}

function rainfallPattern(h, totalHours, rng) {
  const seasonal = 2 + 2 * Math.sin((2 * Math.PI * h) / Math.max(totalHours, 1));
  const baseline = Math.max(0, gaussian(rng, seasonal, 1.5));
  if (rng() < 0.07) return round(baseline + uniform(rng, 8, 35), 2);
  if (rng() < 0.02) return round(baseline + uniform(rng, 35, 60), 2);
  return round(baseline, 2);
}

function waterLevelFromRain(vulnerability, rain6h, previous, rng) {
  return round(
    clamp(15 + vulnerability * 3 + rain6h * 0.75 + previous * 0.55 * 0.25 + gaussian(rng, 0, 3.5), 5, 100),
    2,
  );
}

function normalizeStart(start) {
  if (start instanceof Date && !Number.isNaN(start.getTime())) {
    return start;
  }
  return new Date();
}

function generateData(cfg) {
  const days = Number.isInteger(cfg.days) ? cfg.days : 0;
  const seed = Number.isInteger(cfg.seed) ? cfg.seed : 0;
  const start = normalizeStart(cfg.start);

  if (days <= 0) {
    throw new Error('days must be a positive integer.');
  }

  const rng = makeRng(seed);
  const totalHours = days * 24;
  const area_risco = buildAreas();
  const infraestrutura_urbana = buildInfra(area_risco);
  const sensor = buildSensors(infraestrutura_urbana, rng, start);
  const areaById = Object.fromEntries(area_risco.map((a) => [a.idarea_risco, a]));
  const sensorsByInfra = {};
  for (const s of sensor) {
    sensorsByInfra[s.idinfraestrutura_urbana] ??= [];
    sensorsByInfra[s.idinfraestrutura_urbana].push(s);
  }

  const leitura_sensor = [];
  const previsao_meteorologica = [];
  let idleitura_sensor = 1;
  let idprevisao = 1;
  const previousWater = Object.fromEntries(infraestrutura_urbana.map((i) => [i.idinfraestrutura_urbana, uniform(rng, 15, 35)]));
  const rainHistory = Object.fromEntries(area_risco.map((a) => [a.idarea_risco, []]));

  for (let h = 0; h < totalHours; h += 1) {
    const observed = addHours(start, h);
    const observedText = mysqlDate(observed);
    const rainThisHour = {};

    for (const area of area_risco) {
      const rawRain = rainfallPattern(h, totalHours, rng);
      const rain = round(rawRain * (1 + (area.vulnerabilidade_base - 3) * 0.07), 2);
      rainThisHour[area.idarea_risco] = Math.max(0, rain);
      rainHistory[area.idarea_risco].push(rain);
      while (rainHistory[area.idarea_risco].length > 6) {
        rainHistory[area.idarea_risco].shift();
      }
      const forecast = round(clamp(rain + gaussian(rng, 0, 8) + uniform(rng, -3, 12), 0, 70), 2);
      

      previsao_meteorologica.push({
        idprevisao,
        idarea_risco: area.idarea_risco,
        fonte: 'IPMA_simulado',
        data_emissao: observedText,
        data_inicio_previsao: observedText,
        data_fim_previsao: mysqlDate(addHours(observed, 1)),
        horizonte_horas: 1,
        precipitacao_prevista_mm: forecast,
        confianca: round(uniform(rng, 0.65, 0.95), 3),
      });
      idprevisao += 1;
    }

    for (const infra of infraestrutura_urbana) {
      const area = areaById[infra.idarea_risco];
      const rain6h = round(rainHistory[area.idarea_risco].reduce((acc, x) => acc + x, 0), 2);
      const water = waterLevelFromRain(area.vulnerabilidade_base, rain6h, previousWater[infra.idinfraestrutura_urbana], rng);
      previousWater[infra.idinfraestrutura_urbana] = water;
      const flow = round(clamp(water * uniform(rng, 0.6, 1.35), 0, 130), 2);

      for (const s of sensorsByInfra[infra.idinfraestrutura_urbana]) {
        if (s.status === 0 && rng() > 0.25) continue;
        const qualidade_dado = s.status === 0 ? 'falha' : (rng() > 0.08 ? 'boa' : 'suspeita');
        const validada = qualidade_dado === 'boa' ? 1 : 0;
        let tipo_variavel;
        let valor;
        let unidade;
        if (s.tipo === 'nivel_agua') {
          tipo_variavel = 'nivel_agua_percentagem';
          valor = water;
          unidade = '%';
        } else if (s.tipo === 'precipitacao') {
          tipo_variavel = 'precipitacao_horaria';
          valor = rainThisHour[area.idarea_risco];
          unidade = 'mm';
        } else {
          tipo_variavel = 'caudal_estimado';
          valor = flow;
          unidade = 'm3/s';
        }
        leitura_sensor.push({
          idleitura_sensor,
          idsensor: s.idsensor,
          tipo_variavel,
          valor,
          unidade,
          data_observacao: observedText,
          data_registo: mysqlDate(addMinutes(observed, randint(rng, 0, 5))),
          qualidade_dado,
          validada,
        });
        idleitura_sensor += 1;
      }
    }
  }

  return { leitura_sensor, previsao_meteorologica };
}

module.exports = { generateData };
