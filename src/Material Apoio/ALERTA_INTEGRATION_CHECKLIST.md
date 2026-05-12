# 📋 Alerta API - Checklist de Integração

## ✅ Código Gerado

### Arquivos Modificados
- [x] **src/models/alerta.model.js** - Modelo Sequelize com 8 campos
- [x] **src/controllers/alerta.controller.js** - 6 funções CRUD + filtros
- [x] **src/routes/alerta.routes.js** - 6 rotas HTTP

### Arquivos de Documentação Criados
- [x] **ALERTA_IMPLEMENTATION_SUMMARY.md** - Resumo geral
- [x] **ALERTA_API_EXAMPLES.md** - Exemplos JSON de requisições
- [x] **ALERTA_SQL_SCRIPT.sql** - Script de criação da tabela
- [x] **ALERTA_CODE_REFERENCE.js** - Referência do código
- [x] **ALERTA_API_TESTS.json** - Colecção Postman

---

## 🔧 Passos de Integração

### 1. Verificar Configuração do Banco de Dados
- [ ] Confirmar conexão MySQL em `src/models/db.config.js`
- [ ] Verificar credenciais e nome da base de dados
- [ ] Testar conectividade: `npm start`

### 2. Executar Script SQL
```bash
# Copiar e executar o conteúdo de ALERTA_SQL_SCRIPT.sql no MySQL
mysql -u usuario -p nome_db < ALERTA_SQL_SCRIPT.sql
```
- [ ] Script executado com sucesso
- [ ] Tabela `alerta` criada
- [ ] Tabelas de referência existem (nivel_alerta, area_risco, infraestrutura_urbana)

### 3. Verificar Importação do Modelo
```javascript
// No ficheiro db.config.js, adicione:
import alertaModel from './alerta.model.js';
db.Alerta = alertaModel(sequelize, DataTypes);
```
- [ ] Modelo `alerta` importado em `db.config.js`
- [ ] Sequelize sincronizado com `db.sequelize.sync()`

### 4. Verificar Rotas
```javascript
// app.js já tem:
import alertasRoutes from './src/routes/alerta.routes.js';
app.use('/alertas', alertasRoutes);
```
- [ ] Rotas importadas em `app.js`
- [ ] Rotas montadas em `/alertas`

### 5. Testar a API
```bash
# Iniciar servidor
npm start

# Em outro terminal, testar endpoints
curl http://localhost:3001/alertas
```
- [ ] GET /alertas funciona
- [ ] POST /alertas funciona
- [ ] PUT /alertas/:id funciona
- [ ] DELETE /alertas/:id funciona

---

## 📝 Campos Implementados

| Campo | Tipo | Validação | Obrigatório |
|-------|------|-----------|-------------|
| idalerta | INT (PK, AI) | - | ✓ Auto |
| idnivel_alerta | INT (FK) | > 0 | ✓ Sim |
| idarea_risco | INT (FK) | > 0 | ✓ Sim |
| idinfraestrutura_urbana | INT (FK) | > 0 | ✓ Sim |
| data_alerta | DATE | - | ✗ Não (default: NOW) |
| descricao | STRING | Não vazio | ✓ Sim |
| score_risco | DECIMAL(5,2) | 0-100 | ✓ Sim |
| estado | ENUM | ativo/resolvido/cancelado | ✗ Não (default: ativo) |

---

## 🚀 Endpoints Disponíveis

### POST /alertas - Criar Alerta
**Requerimentos:**
```json
{
  "idnivel_alerta": 1,
  "idarea_risco": 1,
  "idinfraestrutura_urbana": 1,
  "descricao": "Descrição do alerta",
  "score_risco": 75.50
}
```
- [ ] Funciona
- [ ] Valida campos obrigatórios
- [ ] Valida score_risco (0-100)

### GET /alertas - Listar Todos
- [ ] Retorna lista vazia ou com dados
- [ ] Inclui HATEOAS links

### GET /alertas/:id - Obter por ID
- [ ] Retorna alerta se existe
- [ ] Retorna 404 se não existe

### GET /alertas/estado/:estado - Filtrar por Estado
- [ ] Aceita: ativo, resolvido, cancelado
- [ ] Retorna alertas filtrados

### PUT /alertas/:id - Atualizar
- [ ] Permite atualização parcial
- [ ] Valida score_risco se enviado

### DELETE /alertas/:id - Deletar
- [ ] Deleta alerta existente
- [ ] Retorna 404 se não existe

---

## 🧪 Testes Recomendados

### Testes de Criação
- [ ] Criar alerta com todos os campos
- [ ] Criar alerta sem campos opcionais
- [ ] Tentar criar com score_risco > 100 (deve falhar)
- [ ] Tentar criar sem campo obrigatório (deve falhar)

### Testes de Leitura
- [ ] Listar todos os alertas
- [ ] Obter alerta por ID existente
- [ ] Obter alerta por ID inexistente (404)
- [ ] Filtrar por estado ativo
- [ ] Filtrar por estado resolvido
- [ ] Filtrar por estado cancelado
- [ ] Filtrar por estado inválido (deve falhar)

### Testes de Atualização
- [ ] Atualizar estado
- [ ] Atualizar score_risco
- [ ] Atualizar múltiplos campos
- [ ] Tentar atualizar com score_risco inválido
- [ ] Atualizar alerta inexistente (404)

### Testes de Deleção
- [ ] Deletar alerta existente
- [ ] Deletar alerta já deletado (404)
- [ ] Listar e confirmar deleção

### Testes de Validação
- [ ] Verificar scores entre 0 e 100
- [ ] Verificar estados (ativo, resolvido, cancelado)
- [ ] Verificar campos obrigatórios
- [ ] Verificar tipos de dados

---

## 📊 Verificação de Dados

### No MySQL
```sql
-- Verificar tabela criada
SHOW TABLES LIKE 'alerta';

-- Verificar estrutura
DESCRIBE alerta;

-- Contar registos
SELECT COUNT(*) FROM alerta;

-- Ver todos os alertas
SELECT * FROM alerta;

-- Ver por estado
SELECT * FROM alerta WHERE estado = 'ativo';

-- Ver por score alto
SELECT * FROM alerta WHERE score_risco > 80;
```

---

## 🐛 Troubleshooting

### Problema: "Table doesn't exist"
- [ ] Executar ALERTA_SQL_SCRIPT.sql
- [ ] Verificar nome da base de dados

### Problema: "Foreign key constraint fails"
- [ ] Verificar tabelas nivel_alerta, area_risco, infraestrutura_urbana
- [ ] Verificar valores das foreign keys existem

### Problema: "Rota não encontrada"
- [ ] Verificar app.js tem `app.use('/alertas', alertasRoutes)`
- [ ] Reiniciar servidor após mudanças

### Problema: "Validation error"
- [ ] Verificar tipos de dados enviados
- [ ] Verificar score_risco está entre 0-100
- [ ] Verificar estado é um dos valores permitidos

---

## ✨ Próximos Passos

Depois de validar tudo:

1. [ ] Adicionar middleware de autenticação
2. [ ] Implementar paginação em listagens
3. [ ] Adicionar rate limiting
4. [ ] Implementar caching
5. [ ] Criar testes unitários
6. [ ] Documentar no Swagger/OpenAPI
7. [ ] Configurar CI/CD
8. [ ] Monitorar performance

---

## 📞 Documentação de Referência

- 📄 [ALERTA_IMPLEMENTATION_SUMMARY.md](ALERTA_IMPLEMENTATION_SUMMARY.md)
- 📄 [ALERTA_API_EXAMPLES.md](ALERTA_API_EXAMPLES.md)
- 📄 [ALERTA_SQL_SCRIPT.sql](ALERTA_SQL_SCRIPT.sql)
- 📄 [ALERTA_CODE_REFERENCE.js](ALERTA_CODE_REFERENCE.js)
- 📄 [ALERTA_API_TESTS.json](ALERTA_API_TESTS.json)

---

## ✅ Status de Implementação

| Item | Status | Data |
|------|--------|------|
| Modelo Alerta | ✅ Concluído | 2026-05-12 |
| Controller CRUD | ✅ Concluído | 2026-05-12 |
| Rotas API | ✅ Concluído | 2026-05-12 |
| Documentação | ✅ Concluída | 2026-05-12 |
| Script SQL | ✅ Concluído | 2026-05-12 |
| Testes Manuais | ⏳ Pendente | - |
| Integração em Produção | ⏳ Pendente | - |

---

**Gerado em:** 2026-05-12  
**Versão:** 1.0  
**Autor:** Copilot Assistant
