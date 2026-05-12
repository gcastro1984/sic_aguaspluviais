# Area de Risco API - Exemplos de Utilização

## Campos da Tabela Area de Risco

| Campo | Tipo | Descrição |
|-------|------|-----------|
| idarea_risco | INTEGER (PK, Auto-increment) | ID único da área de risco |
| nome | STRING(100) | Nome da área (único) |
| localizacao | STRING(255) | Localização geográfica |
| vulnerabilidade_base | INTEGER | Nível de vulnerabilidade (1-5) |
| descricao | TEXT | Descrição detalhada da área |

---

## Exemplos de Requisições

### 1. Criar uma Nova Área de Risco
**POST** `/areasrisco`

```json
{
    "nome": "Zona Ribeirinha",
    "localizacao": "Vila do Conde - Marginal e Rio Ave",
    "vulnerabilidade_base": 5,
    "descricao": "Área baixa próxima do rio, sensível a maré cheia e precipitação acumulada."
}
```

**Resposta (201 Created):**
```json
{
    "idarea_risco": 1,
    "nome": "Zona Ribeirinha",
    "localizacao": "Vila do Conde - Marginal e Rio Ave",
    "vulnerabilidade_base": 5,
    "descricao": "Área baixa próxima do rio, sensível a maré cheia e precipitação acumulada.",
    "createdAt": "2026-05-12T10:30:45.000Z",
    "updatedAt": "2026-05-12T10:30:45.000Z",
    "links": {
        "allAreas": { "href": "/areasrisco", "method": "GET" },
        "self": { "href": "/areasrisco/1" },
        "update": { "href": "/areasrisco/1", "method": "PUT" },
        "delete": { "href": "/areasrisco/1", "method": "DELETE" }
    }
}
```

---

### 2. Obter Todas as Áreas de Risco
**GET** `/areasrisco`

**Resposta (200 OK):**
```json
{
    "data": [
        {
            "idarea_risco": 1,
            "nome": "Zona Ribeirinha",
            "localizacao": "Vila do Conde - Marginal e Rio Ave",
            "vulnerabilidade_base": 5,
            "descricao": "Área baixa próxima do rio, sensível a maré cheia e precipitação acumulada.",
            "links": {
                "self": { "href": "/areasrisco/1" },
                "update": { "href": "/areasrisco/1", "method": "PUT" },
                "delete": { "href": "/areasrisco/1", "method": "DELETE" }
            }
        },
        {
            "idarea_risco": 2,
            "nome": "Passagem Inferior",
            "localizacao": "Vila do Conde - Acesso rodoviário inferior",
            "vulnerabilidade_base": 4,
            "descricao": "Zona com histórico de acumulação rápida de água em eventos intensos."
        }
    ],
    "total": 2
}
```

---

### 3. Obter Área de Risco por ID
**GET** `/areasrisco/1`

**Resposta (200 OK):**
```json
{
    "idarea_risco": 1,
    "nome": "Zona Ribeirinha",
    "localizacao": "Vila do Conde - Marginal e Rio Ave",
    "vulnerabilidade_base": 5,
    "descricao": "Área baixa próxima do rio, sensível a maré cheia e precipitação acumulada.",
    "links": {
        "allAreas": { "href": "/areasrisco", "method": "GET" },
        "update": { "href": "/areasrisco/1", "method": "PUT" },
        "delete": { "href": "/areasrisco/1", "method": "DELETE" }
    }
}
```

---

### 4. Filtrar Áreas por Nível de Vulnerabilidade
**GET** `/areasrisco/vulnerabilidade/5`

**Resposta (200 OK):**
```json
{
    "data": [
        {
            "idarea_risco": 1,
            "nome": "Zona Ribeirinha",
            "localizacao": "Vila do Conde - Marginal e Rio Ave",
            "vulnerabilidade_base": 5,
            "descricao": "Área baixa próxima do rio, sensível a maré cheia e precipitação acumulada.",
            "links": {
                "self": { "href": "/areasrisco/1" },
                "update": { "href": "/areasrisco/1", "method": "PUT" },
                "delete": { "href": "/areasrisco/1", "method": "DELETE" }
            }
        }
    ],
    "total": 1,
    "vulnerabilidade": 5
}
```

---

### 5. Atualizar uma Área de Risco
**PUT** `/areasrisco/1`

```json
{
    "vulnerabilidade_base": 4,
    "descricao": "Área atualizada com nova análise de risco."
}
```

**Resposta (200 OK):**
```json
{
    "message": "Área de risco atualizada com sucesso",
    "data": {
        "idarea_risco": 1,
        "nome": "Zona Ribeirinha",
        "localizacao": "Vila do Conde - Marginal e Rio Ave",
        "vulnerabilidade_base": 4,
        "descricao": "Área atualizada com nova análise de risco.",
        "links": {
            "allAreas": { "href": "/areasrisco", "method": "GET" },
            "self": { "href": "/areasrisco/1" },
            "delete": { "href": "/areasrisco/1", "method": "DELETE" }
        }
    }
}
```

---

### 6. Deletar uma Área de Risco
**DELETE** `/areasrisco/1`

**Resposta (200 OK):**
```json
{
    "message": "Área de risco com ID 1 deletada com sucesso",
    "links": {
        "allAreas": { "href": "/areasrisco", "method": "GET" }
    }
}
```

---

## Validações

- **nome**: Obrigatório, único, máximo 100 caracteres
- **localizacao**: Obrigatório, máximo 255 caracteres
- **vulnerabilidade_base**: Obrigatório, inteiro entre 1 e 5
- **descricao**: Opcional, texto livre

---

## Tratamento de Erros

### Erro de Campos Obrigatórios
**Status:** 400 Bad Request
```json
{
    "error": "Campos obrigatórios faltam",
    "fields": ["nome", "localizacao", "vulnerabilidade_base"]
}
```

### Erro de Vulnerabilidade Inválida
**Status:** 400 Bad Request
```json
{
    "error": "vulnerabilidade_base deve estar entre 1 e 5"
}
```

### Erro de Nome Duplicado
**Status:** 400 Bad Request
```json
{
    "error": "Área de risco com nome 'Zona Ribeirinha' já existe"
}
```

### Área Não Encontrada
**Status:** 404 Not Found
```json
{
    "error": "Área de risco com ID 999 não encontrada"
}
```

