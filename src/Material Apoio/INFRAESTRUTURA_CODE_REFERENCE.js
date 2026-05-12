// ============================================
// INFRAESTRUTURA URBANA MODEL - CÓDIGO COMPLETO
// ============================================

/**
 * Modelo Sequelize para Infraestruturas Urbanas
 *
 * Campos:
 * - idinfraestrutura_urbana: ID único (PK, Auto-increment)
 * - nome: Nome da infraestrutura (Max 255 chars)
 * - tipo: Tipo de infraestrutura (Max 100 chars)
 * - localizacao: Localização geográfica (Max 255 chars)
 * - idarea_risco: Referência para área de risco (FK)
 */

// Model Fields:
// {
//     idinfraestrutura_urbana: INTEGER (PK, Auto-increment),
//     nome: STRING(255) - Required,
//     tipo: STRING(100) - Required,
//     localizacao: STRING(255) - Required,
//     idarea_risco: INTEGER (FK) - Required,
//     createdAt: DATETIME - Auto,
//     updatedAt: DATETIME - Auto
// }

// ============================================
// INFRAESTRUTURA URBANA CONTROLLER - FUNCIONALIDADES
// ============================================

/**
 * 1. criarInfraestruturaUrbana(req, res, next)
 *    - Cria uma nova infraestrutura urbana
 *    - Valida campos obrigatórios
 *    - Valida FK (idarea_risco)
 *    - Retorna infraestrutura criada com HATEOAS links
 *
 * 2. obterInfraestruturas(req, res, next)
 *    - Lista todas as infraestruturas
 *    - Adiciona HATEOAS links
 *    - Retorna total
 *
 * 3. obterInfraestruturaUrbanaId(req, res, next)
 *    - Obtém infraestrutura específica pelo ID
 *    - Retorna 404 se não encontrada
 *
 * 4. atualizarInfraestruturaUrbana(req, res, next)
 *    - Atualiza campos
 *    - Permite atualização parcial
 *    - Valida FK se modificado
 *
 * 5. deletarInfraestruturaUrbana(req, res, next)
 *    - Deleta infraestrutura
 *    - Retorna confirmação
 *
 * 6. obterInfraestruturasPorArea(req, res, next)
 *    - Filtra por idarea_risco
 *    - Retorna lista filtrada
 *
 * 7. obterInfraestruturasPorTipo(req, res, next)
 *    - Filtra por tipo
 *    - Retorna lista filtrada
 */

// ============================================
// ROTAS - ENDPOINTS
// ============================================

/**
 * POST /infraestruturas
 * - Criar nova infraestrutura
 * Body: { nome, tipo, localizacao, idarea_risco }
 *
 * GET /infraestruturas
 * - Listar todas
 *
 * GET /infraestruturas/:id
 * - Obter por ID
 *
 * GET /infraestruturas/area/:idarea_risco
 * - Filtrar por área de risco
 *
 * GET /infraestruturas/tipo/:tipo
 * - Filtrar por tipo
 *
 * PUT /infraestruturas/:id
 * - Atualizar
 * Body: { nome?, tipo?, localizacao?, idarea_risco? }
 *
 * DELETE /infraestruturas/:id
 * - Deletar
 */

// ============================================
// VALIDAÇÕES IMPLEMENTADAS
// ============================================

/**
 * Validações de Campo:
 * ✓ nome: Obrigatório, string, max 255 chars
 * ✓ tipo: Obrigatório, string, max 100 chars
 * ✓ localizacao: Obrigatório, string, max 255 chars
 * ✓ idarea_risco: Obrigatório, integer, FK
 *
 * Validações de Negócio:
 * ✓ Campos obrigatórios na criação
 * ✓ Referência inteligral com chave estrangeira
 * ✓ Sem duplicação (múltiplas infras podem ter mesmo tipo/nome)
 */

// ============================================
// RESPOSTA HATEOAS
// ============================================

/**
 * Todas as respostas incluem links HATEOAS:
 *
 * {
 *     "idinfraestrutura_urbana": 1,
 *     "nome": "Coletor Principal - Zona Ribeirinha",
 *     "tipo": "coletor_pluvial",
 *     "localizacao": "Vila do Conde - Marginal e Rio Ave",
 *     "idarea_risco": 1,
 *     "createdAt": "2026-05-12T10:30:45.000Z",
 *     "updatedAt": "2026-05-12T10:30:45.000Z",
 *     "links": {
 *         "allInfras": { "href": "/infraestruturas", "method": "GET" },
 *         "self": { "href": "/infraestruturas/1" },
 *         "update": { "href": "/infraestruturas/1", "method": "PUT" },
 *         "delete": { "href": "/infraestruturas/1", "method": "DELETE" }
 *     }
 * }
 */

// ============================================
// TRATAMENTO DE ERROS
// ============================================

/**
 * Tipos de Erro Tratados:
 *
 * 400 Bad Request:
 * - Campos obrigatórios faltam
 * - FK (idarea_risco) inválida
 *
 * 404 Not Found:
 * - Infraestrutura com ID não encontrada
 * - Nenhuma infraestrutura com critério de filtro
 *
 * 500 Internal Server Error:
 * - Erros genéricos da aplicação
 */

// ============================================
// DADOS DE EXEMPLO
// ============================================

/**
 * Exemplo de dados do utilizador:
 *
 * {
 *     "idinfraestrutura_urbana": 1,
 *     "nome": "Coletor Principal - Zona Ribeirinha",
 *     "tipo": "coletor_pluvial",
 *     "localizacao": "Vila do Conde - Marginal e Rio Ave",
 *     "idarea_risco": 1
 * }
 */

// ============================================
// INDICES DE BANCO DE DADOS
// ============================================

/**
 * Índices criados:
 * - idinfraestrutura_urbana (Primary Key, Auto-increment)
 * - idarea_risco (Foreign Key, Index)
 * - tipo (Index para filtros)
 */

// ============================================
// INTEGRAÇÃO NO APP.JS
// ============================================

/**
 * No app.js, adicionar:
 *
 * import infraestruturaRoutes from './src/routes/infraestrutura.routes.js';
 * app.use('/infraestruturas', infraestruturaRoutes);
 *
 * Todas as rotas disponíveis em:
 * http://localhost:3001/infraestruturas
 */

// ============================================
// EXEMPLOS DE CURL
// ============================================

// Criar infraestrutura:
// curl -X POST http://localhost:3001/infraestruturas \
//   -H "Content-Type: application/json" \
//   -d '{
//     "nome":"Coletor Principal",
//     "tipo":"coletor_pluvial",
//     "localizacao":"Vila do Conde",
//     "idarea_risco":1
//   }'

// Listar:
// curl http://localhost:3001/infraestruturas

// Obter:
// curl http://localhost:3001/infraestruturas/1

// Filtrar por área:
// curl http://localhost:3001/infraestruturas/area/1

// Filtrar por tipo:
// curl http://localhost:3001/infraestruturas/tipo/coletor_pluvial

// Atualizar:
// curl -X PUT http://localhost:3001/infraestruturas/1 \
//   -H "Content-Type: application/json" \
//   -d '{"tipo":"coletor_principal"}'

// Deletar:
// curl -X DELETE http://localhost:3001/infraestruturas/1
