# Gerador de dados sintéticos em JavaScript

Este ficheiro é a versão JavaScript/Node.js do gerador de dados.

Não usa dependências externas.

## Executar

```bash
node generate_monitoring_data_node_v2.js --days 14 --output synthetic_data
```

## Gerar também SQL para MySQL

```bash
node generate_monitoring_data_node_v2.js --days 30 --seed 123 --output synthetic_data --sql
```

## Gerar com data inicial fixa

```bash
node generate_monitoring_data_node_v2.js --days 30 --start 2026-01-01T00:00:00Z --output synthetic_data --sql
```

## Inserir no MySQL

```bash
mysql -u root -p monitorizacao_urbana < synthetic_data/insert_synthetic_data.sql
```

## Tabelas geradas

- `area_risco`
- `infraestrutura_urbana`
- `sensor`
- `leitura_sensor`
- `previsao_meteorologica`
- `nivel_alerta`
- `criterio_alerta`
- `alerta`
- `alerta_evidencia`
- `utilizador`
- `destinatario`
- `alerta_destinatario`
- `notificacao`
- `plano_acao`
- `plano_alerta`
- `alerta_plano_acao`
- `relatorio`
