# Alerta API - Exemplos de Utilização

## Campos da Tabela Alerta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| idalerta | INTEGER (PK, Auto-increment) | ID único do alerta |
| idnivel_alerta | INTEGER (FK) | Referência para nível de alerta |
| idarea_risco | INTEGER (FK) | Referência para área de risco |
| idinfraestrutura_urbana | INTEGER (FK) | Referência para infraestrutura urbana |
| data_alerta | DATE | Data e hora do alerta (default: NOW) |
| descricao | STRING | Descrição do alerta |
| score_risco | DECIMAL(5,2) | Score de risco (0-100) |
| estado | ENUM | Estado do alerta: 'ativo', 'resolvido', 'cancelado' (default: 'ativo') |

---

## Exemplos de Requisições

### 1. Criar um Novo Alerta
**POST** `/alertas`

```json
{
    "idnivel_alerta": 1,
    "idarea_risco": 2,
    "idinfraestrutura_urbana": 3,
    "descricao": "Alerta de chuva intensa com risco de inundação",
    "score_risco": 85.50,
    "estado": "ativo"
}
```

**Resposta (201 Created):**
```json
{
    "idalerta": 1,
    "idnivel_alerta": 1,
    "idarea_risco": 2,
    "idinfraestrutura_urbana": 3,
    "data_alerta": "2026-05-12T10:30:45.000Z",
    "descricao": "Alerta de chuva intensa com risco de inundação",
    "score_risco": 85.50,
    "estado": "ativo",
    "links": {
        "allAlertas": { "href": "/alertas", "method": "GET" },
        "self": { "href": "/alertas/1" },
        "update": { "href": "/alertas/1", "method": "PUT" },
        "delete": { "href": "/alertas/1", "method": "DELETE" }
    }
}
```

---

### 2. Obter Todos os Alertas
**GET** `/alertas`

**Resposta (200 OK):**
```json
{
    "data": [
        {
            "idalerta": 1,
            "idnivel_alerta": 1,
            "idarea_risco": 2,
            "idinfraestrutura_urbana": 3,
            "data_alerta": "2026-05-12T10:30:45.000Z",
            "descricao": "Alerta de chuva intensa com risco de inundação",
            "score_risco": 85.50,
            "estado": "ativo",
            "links": {
                "self": { "href": "/alertas/1" },
                "update": { "href": "/alertas/1", "method": "PUT" },
                "delete": { "href": "/alertas/1", "method": "DELETE" }
            }
        }
    ],
    "total": 1
}
```

---

### 3. Obter Alerta por ID
**GET** `/alertas/1`

**Resposta (200 OK):**
```json
{
    "idalerta": 1,
    "idnivel_alerta": 1,
    "idarea_risco": 2,
    "idinfraestrutura_urbana": 3,
    "data_alerta": "2026-05-12T10:30:45.000Z",
    "descricao": "Alerta de chuva intensa com risco de inundação",
    "score_risco": 85.50,
    "estado": "ativo",
    "links": {
        "allAlertas": { "href": "/alertas", "method": "GET" },
        "update": { "href": "/alertas/1", "method": "PUT" },
        "delete": { "href": "/alertas/1", "method": "DELETE" }
    }
}
```

---

### 4. Atualizar um Alerta
**PUT** `/alertas/1`

```json
{
    "estado": "resolvido",
    "score_risco": 45.00
}
```

**Resposta (200 OK):**
```json
{
    "message": "Alerta atualizado com sucesso",
    "data": {
        "idalerta": 1,
        "idnivel_alerta": 1,
        "idarea_risco": 2,
        "idinfraestrutura_urbana": 3,
        "data_alerta": "2026-05-12T10:30:45.000Z",
        "descricao": "Alerta de chuva intensa com risco de inundação",
        "score_risco": 45.00,
        "estado": "resolvido",
        "links": {
            "allAlertas": { "href": "/alertas", "method": "GET" },
            "self": { "href": "/alertas/1" },
            "delete": { "href": "/alertas/1", "method": "DELETE" }
        }
    }
}
```

---

### 5. Deletar um Alerta
**DELETE** `/alertas/1`

**Resposta (200 OK):**
```json
{
    "message": "Alerta com ID 1 deletado com sucesso",
    "links": {
        "allAlertas": { "href": "/alertas", "method": "GET" }
    }
}
```

---

### 6. Obter Alertas por Estado
**GET** `/alertas/estado/ativo`

**Resposta (200 OK):**
```json
{
    "data": [
        {
            "idalerta": 1,
            "idnivel_alerta": 1,
            "idarea_risco": 2,
            "idinfraestrutura_urbana": 3,
            "data_alerta": "2026-05-12T10:30:45.000Z",
            "descricao": "Alerta de chuva intensa com risco de inundação",
            "score_risco": 85.50,
            "estado": "ativo",
            "links": {
                "self": { "href": "/alertas/1" },
                "update": { "href": "/alertas/1", "method": "PUT" },
                "delete": { "href": "/alertas/1", "method": "DELETE" }
            }
        }
    ],
    "total": 1,
    "estado": "ativo"
}
```

---

## Validações

- **idnivel_alerta, idarea_risco, idinfraestrutura_urbana, descricao**: Obrigatórios na criação
- **score_risco**: Deve estar entre 0 e 100
- **estado**: Valores permitidos: 'ativo', 'resolvido', 'cancelado'
- **data_alerta**: Se não fornecida, usa a data/hora atual

---

## Tratamento de Erros

### Erro de Campos Obrigatórios
**Status:** 400 Bad Request
```json
{
    "error": "Campos obrigatórios faltam",
    "fields": ["idnivel_alerta", "idarea_risco", "idinfraestrutura_urbana", "descricao", "score_risco"]
}
```

### Erro de Score Inválido
**Status:** 400 Bad Request
```json
{
    "error": "score_risco deve estar entre 0 e 100"
}
```

### Alerta Não Encontrado
**Status:** 404 Not Found
```json
{
    "error": "Alerta com ID 999 não encontrado"
}
```

