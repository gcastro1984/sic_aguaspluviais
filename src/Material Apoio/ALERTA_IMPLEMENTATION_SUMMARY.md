# Alerta API - Resumo de Implementação

## ✅ Código Gerado

Este documento resume o código gerado para o módulo de alertas (Alerta API) com os campos solicitados.

### Campos Implementados

```
- idalerta (INTEGER, PK, Auto-increment)
- idnivel_alerta (INTEGER, FK)
- idarea_risco (INTEGER, FK)
- idinfraestrutura_urbana (INTEGER, FK)
- data_alerta (DATE, default: CURRENT_TIMESTAMP)
- descricao (STRING)
- score_risco (DECIMAL 5,2, range: 0-100)
- estado (ENUM: ativo, resolvido, cancelado)
```

---

## 📁 Arquivos Modificados

### 1. [src/models/alerta.model.js](src/models/alerta.model.js)
**Descrição:** Modelo Sequelize com definição de todos os campos

**Características:**
- ✅ Todos os 8 campos solicitados
- ✅ Validações (score_risco entre 0-100)
- ✅ Foreign keys para relacionamentos
- ✅ Timestamps automáticos (createdAt, updatedAt)

**Exemplos de Validações:**
```javascript
idnivel_alerta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
        model: 'nivel_alerta',
        key: 'id'
    }
}

score_risco: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
        min: 0,
        max: 100
    }
}

estado: {
    type: DataTypes.ENUM('ativo', 'resolvido', 'cancelado'),
    allowNull: false,
    defaultValue: 'ativo'
}
```

---

### 2. [src/controllers/alerta.controller.js](src/controllers/alerta.controller.js)
**Descrição:** Controller com operações CRUD completas

**Funções Implementadas:**

| Função | Método HTTP | Endpoint | Descrição |
|--------|-------------|----------|-----------|
| criarAlerta | POST | `/alertas` | Cria novo alerta |
| obterAlertas | GET | `/alertas` | Lista todos os alertas |
| obterAlertaPorId | GET | `/alertas/:id` | Obtém alerta específico |
| atualizarAlerta | PUT | `/alertas/:id` | Atualiza alerta |
| deletarAlerta | DELETE | `/alertas/:id` | Deleta alerta |
| obterAlertasPorEstado | GET | `/alertas/estado/:estado` | Lista por estado |

**Validações Implementadas:**
- ✅ Campos obrigatórios na criação
- ✅ Score de risco entre 0-100
- ✅ Estados válidos (ativo, resolvido, cancelado)
- ✅ Tratamento de erros Sequelize
- ✅ HATEOAS links em todas as respostas

---

### 3. [src/routes/alerta.routes.js](src/routes/alerta.routes.js)
**Descrição:** Rotas API completas

**Rotas Definidas:**
```javascript
POST   /alertas                    - Criar alerta
GET    /alertas                    - Listar todos
GET    /alertas/:id                - Obter por ID
PUT    /alertas/:id                - Atualizar
DELETE /alertas/:id                - Deletar
GET    /alertas/estado/:estado     - Filtrar por estado
```

---

## 📋 Arquivos de Documentação Criados

### [ALERTA_API_EXAMPLES.md](ALERTA_API_EXAMPLES.md)
Exemplos completos de todas as requisições e respostas da API com exemplos de JSON.

### [ALERTA_SQL_SCRIPT.sql](ALERTA_SQL_SCRIPT.sql)
Script SQL para criar a tabela e exemplos de INSERT e consultas úteis.

---

## 🚀 Como Usar

### 1. **Executar o Script SQL**
```bash
mysql -u usuario -p banco_dados < ALERTA_SQL_SCRIPT.sql
```

### 2. **Verificar Configuração do Projeto**
Certifique-se que o `db.config.js` está corretamente configurado e que o modelo está importado.

### 3. **Testar a API**

**Criar alerta (cURL):**
```bash
curl -X POST http://localhost:3000/alertas \
  -H "Content-Type: application/json" \
  -d '{
    "idnivel_alerta": 1,
    "idarea_risco": 1,
    "idinfraestrutura_urbana": 1,
    "descricao": "Alerta de teste",
    "score_risco": 75.50
  }'
```

**Listar todos os alertas:**
```bash
curl http://localhost:3000/alertas
```

**Obter alerta por ID:**
```bash
curl http://localhost:3000/alertas/1
```

**Filtrar por estado:**
```bash
curl http://localhost:3000/alertas/estado/ativo
```

**Atualizar alerta:**
```bash
curl -X PUT http://localhost:3000/alertas/1 \
  -H "Content-Type: application/json" \
  -d '{"estado": "resolvido"}'
```

**Deletar alerta:**
```bash
curl -X DELETE http://localhost:3000/alertas/1
```

---

## 📊 Estrutura de Dados

```
┌─────────────────────────────────────────────────────┐
│                    ALERTA                           │
├─────────────────────────────────────────────────────┤
│ PK │ idalerta (INT, AI)          [Auto-increment]   │
├────┼─────────────────────────────────────────────────┤
│ FK │ idnivel_alerta (INT, NN)    → nivel_alerta.id  │
│ FK │ idarea_risco (INT, NN)      → area_risco.id    │
│ FK │ idinfraestrutura_urbana (INT, NN) → infra.id   │
├────┼─────────────────────────────────────────────────┤
│    │ data_alerta (DATE)          [Default: NOW]     │
│    │ descricao (VARCHAR)         [Não nulo]         │
│    │ score_risco (DECIMAL 5,2)   [0-100]            │
│    │ estado (ENUM)               ['ativo', ...]     │
├────┼─────────────────────────────────────────────────┤
│    │ createdAt (DATETIME)        [Auto]             │
│    │ updatedAt (DATETIME)        [Auto]             │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Recursos Implementados

✅ **Modelo Sequelize** com validações  
✅ **CRUD Completo** (Create, Read, Update, Delete)  
✅ **Validações de Dados**  
✅ **Tratamento de Erros**  
✅ **HATEOAS Links** em respostas  
✅ **Filtros** (por estado, por ID)  
✅ **Índices de Banco de Dados**  
✅ **Documentação** com exemplos  

---

## 🔧 Próximos Passos (Opcional)

1. Adicionar autenticação/autorização
2. Implementar paginação em listagens
3. Adicionar middleware de validação customizado
4. Implementar cache para melhor performance
5. Criar testes unitários e de integração
6. Adicionar logging estruturado

---

## 📞 Suporte

Para mais informações, consulte:
- [ALERTA_API_EXAMPLES.md](ALERTA_API_EXAMPLES.md) - Exemplos de requisições
- [ALERTA_SQL_SCRIPT.sql](ALERTA_SQL_SCRIPT.sql) - Script SQL e consultas
- Ficheiros do controller para lógica detalhada
