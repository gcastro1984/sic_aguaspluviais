import pkg from '../../gerador_dados_monitorizacao_javascript_v2/generate_monitoring_data_node_v2copy.cjs';

const { generateData } = pkg;
const data = generateData({
  days: 1,
  seed: 42,
  start: new Date()
});
const leituras = data.leitura_sensor;
console.log(`Geradas ${leituras.length} leituras de sensores.`);


// remover ID automático
function limparLeitura(leitura) {
  const { idleitura_sensor,data_registo, ...resto } = leitura;
  return resto;
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
    console.error("❌ ERRO BACKEND:", text);
    return null;
  }


  return response.json();
}


// execução
async function main() {
  for (const leitura of leituras) {
    await enviarLeitura(limparLeitura(leitura));
  }

  console.log("✅ Todas as leituras enviadas!");
}

main();
