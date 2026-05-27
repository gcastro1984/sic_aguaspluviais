import pkg from '../../gerador_dados_monitorizacao_javascript_v2/generate_monitoring_data_node_v2copy.cjs';

const { generateData } = pkg;

// Começar ontem para que todas as data_observacao sejam no passado
const start = new Date();
start.setDate(start.getDate() - 1);

const data = generateData({
  days: 1,
  seed: 42,
  start
});
const leituras = data.leitura_sensor;
console.log(`Geradas ${leituras.length} leituras de sensores.`);


// remover ID automático e normalizar campos
function limparLeitura(leitura) {
  const { idleitura_sensor, data_registo, ...resto } = leitura;
  // mapear qualidade_dado inválida para valor aceite pela API
  if (resto.qualidade_dado === 'falha') resto.qualidade_dado = 'suspeita';
  return resto;
}

// verificar se o sensor está online na BD antes de enviar
async function sensorOnline(idsensor) {
  const response = await fetch(`http://localhost:3001/sensores/${idsensor}`, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) return false;
  const json = await response.json();
  return json.status === 'online';
}


// enviar para API
async function enviarLeitura(leitura) {
  const response = await fetch("http://localhost:3001/leituras", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(leitura)
  });
  
// verifica se deu erro
  if (!response.ok) {
    const text = await response.text();
    console.error("ERRO BACKEND:", text);
    return null;
  }


  return response.json();
}


// execução
async function main() {
  // cache de sensores verificados para não repetir chamadas
  const cacheOnline = {};
  let enviadas = 0, ignoradas = 0, erros = 0;

  for (const leitura of leituras) {
    const { idsensor } = leitura;

    if (cacheOnline[idsensor] === undefined) {
      cacheOnline[idsensor] = await sensorOnline(idsensor);
    }

    if (!cacheOnline[idsensor]) {
      ignoradas++;
      continue; // ignorar sensores offline/inexistentes
    }

    const resultado = await enviarLeitura(limparLeitura(leitura));
    if (resultado) enviadas++; else erros++;
  }

  console.log(`✅ Enviadas: ${enviadas} | ⏭️  Ignoradas (offline): ${ignoradas} | ❌ Erros: ${erros}`);
}

main();
