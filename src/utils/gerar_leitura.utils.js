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

// Obter, numa única chamada, o conjunto de IDs de sensores online.
// Usa o endpoint de listagem (GET /sensores) que é público — o GET /sensores/:id
// exige token (verifyToken) e devolvia 401, fazendo com que tudo fosse ignorado.
async function obterSensoresOnline() {
  const response = await fetch('http://localhost:3001/sensores?status=online&limit=100', {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Falha ao obter sensores online: HTTP ${response.status}`);
  }
  const json = await response.json();
  return new Set(json.data.map(s => s.idsensor));  // Remove duplicados automaticamente
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


// Pausa em milissegundos entre pedidos — evita sobrecarregar o servidor
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// execução
async function main() {
  // conjunto de IDs online obtido numa única chamada à API
  const sensoresOnline = await obterSensoresOnline();
  let enviadas = 0, ignoradas = 0, erros = 0;

  for (const leitura of leituras) {
    const { idsensor } = leitura;

    if (!sensoresOnline.has(idsensor)) {
      ignoradas++;
      continue; // ignorar sensores offline/inexistentes
    }

    try {
      const resultado = await enviarLeitura(limparLeitura(leitura));
      if (resultado) enviadas++; else erros++;
    } catch (err) {
      // ECONNRESET: o servidor cortou a ligação (sobrecarga) — regista e continua
      if (err.cause?.code === 'ECONNRESET' || err.message?.includes('fetch failed')) {
        console.warn(`[ECONNRESET] Leitura ignorada (sensor ${idsensor}) — servidor ocupado`);
        erros++;
        await esperar(500); // pausa extra após reset antes de continuar
      } else {
        throw err; // outros erros inesperados — relanças
      }
    }

    // Pausa de 50ms entre pedidos para não sobrecarregar o servidor
    // (o POST /leituras faz várias operações: alerta, planos, relatório, email)
    await esperar(50);
  }

  console.log(`✅ Enviadas: ${enviadas} | ⏭️  Ignoradas (offline): ${ignoradas} | ❌ Erros: ${erros}`);
}

main();
