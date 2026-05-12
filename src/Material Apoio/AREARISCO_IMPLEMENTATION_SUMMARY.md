# Area de Risco API - Resumo de Implementação

## ✅ Código Gerado

Implementação completa do módulo de Áreas de Risco com os campos solicitados.

### Campos Implementados

```
- idarea_risco (INTEGER, PK, Auto-increment)
- nome (STRING 100, Unique)
- localizacao (STRING 255)
- vulnerabilidade_base (INTEGER, 1-5)
- descricao (TEXT, Optional)
```

---

## 📁 Arquivos Modificados/Criados

### 1. [src/models/area_risco.model.js](src/models/area_risco.model.js)
**Descrição:** Modelo Sequelize com definição de todos os campos

**Características:**
- ✅ Todos os 5 campos solicitados
- ✅ Validação de vulnerabilidade_base (1-5)
- ✅ Nome único
- ✅ Timestamps automáticos (createdAt, updatedAt)

---

### 2. [src/controllers/arearisco.controller.js](src/controllers/arearisco.controller.js)
**Descrição:** Controller com operações CRUD completas

**Funções Implementadas:**

| Função | Método HTTP | Endpoint | Descrição |
|--------|-------------|----------|-----------|
| criarAreaRisco | POST | `/areasrisco` | Cria nova área |
| obterAreasRisco | GET | `/areasrisco` | Lista todas as áreas |
| obterAreaRiscoPorId | GET | `/areasrisco/:id` | Obtém área específica |
| atualizarAreaRisco | PUT | `/areasrisco/:id` | Atualiza área |
| deletarAreaRisco | DELETE | `/areasrisco/:id` | Deleta área |
| obterAreasPorVulnerabilidade | GET | `/areasrisco/vulnerabilidade/:nivel` | Filtra por nível |

**Validações Implementadas:**
- ✅ Campos obrigatórios
- ✅ Vulnerabilidade entre 1-5
- ✅ Nome único
- ✅ Tratamento de erros Sequelize
- ✅ HATEOAS links em todas as respostas

---

### 3. [src/routes/arearisco.routes.js](src/routes/arearisco.routes.js)
**Descrição:** Rotas API completas

**Rotas Definidas:**
```javascript
POST   /areasrisco                          - Criar área
GET    /areasrisco                          - Listar todas
GET    /areasrisco/:id                      - Obter por ID
PUT    /areasrisco/:id                      - Atualizar
DELETE /areasrisco/:id                      - Deletar
GET    /areasrisco/vulnerabilidade/:nivel   - Filtrar por nível
```

---

## 📋 Arquivos de Documentação Criados

### [AREARISCO_API_EXAMPLES.md](AREARISCO_API_EXAMPLES.md)
Exemplos completos de todas as requisições e respostas da API com exemplos de JSON.

### [AREARISCO_SQL_SCRIPT.sql](AREARISCO_SQL_SCRIPT.sql)
Script SQL para criar a tabela e exemplos de INSERT e consultas úteis baseadas no CSV.

---

## 🚀 Como Usar

### 1. **Executar o Script SQL**
```bash
mysql -u usuario -p banco_dados < AREARISCO_SQL_SCRIPT.sql
```

### 2. **Testar a API**

**Criar área (cURL):**
```bash
curl -X POST http://localhost:3001/areasrisco \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Zona Ribeirinha",
    "localizacao": "Vila do Conde - Marginal e Rio Ave",
    "vulnerabilidade_base": 5,
    "descricao": "Área de alto risco"
  }'
```

**Listar todas as áreas:**
```bash
curl http://localhost:3001/areasrisco
```

**Filtrar por vulnerabilidade:**
```bash
curl http://localhost:3001/areasrisco/vulnerabilidade/5
```

**Atualizar área:**
```bash
curl -X PUT http://localhost:3001/areasrisco/1 \
  -H "Content-Type: application/json" \
  -d '{"vulnerabilidade_base": 4}'
```

**Deletar área:**
```bash
curl -X DELETE http://localhost:3001/areasrisco/1
```

---

## 📊 Estrutura de Dados

```
┌──────────────────────────────────────────────┐
│            AREA_RISCO                        │
├──────────────────────────────────────────────┤
│ PK │ idarea_risco (INT, AI)                  │
├────┼──────────────────────────────────────────┤
│    │ nome (VARCHAR 100, UQ)  [Unique]        │
│    │ localizacao (VARCHAR 255)               │
│    │ vulnerabilidade_base (INT)  [1-5]       │
│    │ descricao (TEXT)                        │
├────┼──────────────────────────────────────────┤
│    │ createdAt (DATETIME)    [Auto]          │
│    │ updatedAt (DATETIME)    [Auto]          │
└──────────────────────────────────────────────┘
```

---

## ✨ Recursos Implementados

✅ **Modelo Sequelize** com validações  
✅ **CRUD Completo** (Create, Read, Update, Delete)  
✅ **Filtro por Vulnerabilidade** (1-5)  
✅ **Validações de Dados**  
✅ **Tratamento de Erros**  
✅ **HATEOAS Links** em respostas  
✅ **Nome Único** (constraint)  
✅ **Índices de Banco de Dados**  
✅ **Documentação** com exemplos  
✅ **Dados Baseados no CSV** importado  

---

## 📊 Dados do CSV

O CSV fornecido contém 4 áreas de risco:

| ID | Nome | Localização | Vulnerabilidade | Descrição |
|---|---|---|---|---|
| 1 | Zona Ribeirinha | Vila do Conde - Marginal e Rio Ave | 5 | Área baixa próxima do rio, sensível a maré cheia e precipitação acumulada. |
| 2 | Passagem Inferior | Vila do Conde - Acesso rodoviário inferior | 4 | Zona com histórico de acumulação rápida de água em eventos intensos. |
| 3 | Centro Urbano | Vila do Conde - Centro | 3 | Zona urbana impermeabilizada, com risco de lençóis de água. |
| 4 | Zona Industrial | Vila do Conde - Área industrial | 2 | Zona com risco moderado e dependente da capacidade de drenagem. |

Estes dados estão incluídos no AREARISCO_SQL_SCRIPT.sql para inserção automática.

---

## 🔧 Próximos Passos (Opcional)

1. Integrar com módulo de alertas (relacionamento)
2. Adicionar paginação em listagens
3. Implementar busca por nome
4. Adicionar geolocalização
5. Criar testes unitários
6. Implementar rate limiting
7. Adicionar autenticação/autorização

---

## 📞 Suporte

Para mais informações, consulte:
- [AREARISCO_API_EXAMPLES.md](AREARISCO_API_EXAMPLES.md) - Exemplos de requisições
- [AREARISCO_SQL_SCRIPT.sql](AREARISCO_SQL_SCRIPT.sql) - Script SQL e consultas
- Ficheiros do controller para lógica detalhada
