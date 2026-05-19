import pkg from '../../gerador_dados_monitorizacao_javascript_v2/generate_monitoring_data_node_v2copy.cjs';

const { generateData } = pkg;
const data = generateData({
	days: 1,
	seed: 42,
	start: new Date()
});
const previsoes = data.previsao_meteorologica || data.previsao || [];
console.log(`Geradas ${previsoes.length} previsões meteorológicas.`);


// remover ID automático e campos de registo
function limparPrevisao(previsao) {
	const { idprevisao, data_emissao, ...resto } = previsao;
	return resto;
}


// enviar para API
async function enviarPrevisao(previsao) {
	const response = await fetch("http://localhost:3001/previsoes", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(previsao)
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
	for (const previsao of previsoes) {
		await enviarPrevisao(limparPrevisao(previsao));
	}

	console.log("✅ Todas as previsões enviadas!");
}

main();

