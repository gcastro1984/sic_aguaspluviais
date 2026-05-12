// ============================================
// ALERTA MODEL - CÓDIGO COMPLETO
// ============================================

/**
 * Modelo Sequelize para Alertas
 * 
 * Campos:
 * - idalerta: ID único (PK, Auto-increment)
 * - idnivel_alerta: Referência para nível de alerta (FK)
 * - idarea_risco: Referência para área de risco (FK)
 * - idinfraestrutura_urbana: Referência para infraestrutura urbana (FK)
 * - data_alerta: Data/hora do alerta (default: NOW)
 * - descricao: Descrição do alerta
 * - score_risco: Score de risco (0-100)
 * - estado: Estado do alerta (ativo, resolvido, cancelado)
 */

export default (sequelize, DataTypes) => sequelize.define('alerta', {

    idalerta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    idnivel_alerta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'nivel_alerta',
            key: 'id'
        }
    },
    idarea_risco: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'area_risco',
            key: 'id'
        }
    },
    idinfraestrutura_urbana: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'infraestrutura_urbana',
            key: 'id'
        }
    },
    data_alerta: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    descricao: {
        type: DataTypes.STRING,
        allowNull: false
    },
    score_risco: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },
    estado: {
        type: DataTypes.ENUM('ativo', 'resolvido', 'cancelado'),
        allowNull: false,
        defaultValue: 'ativo'
    }

});

// ============================================
// ALERTA CONTROLLER - FUNCIONALIDADES
// ============================================

/**
 * 1. criarAlerta(req, res, next)
 *    - Cria um novo alerta
 *    - Valida campos obrigatórios
 *    - Valida score_risco (0-100)
 *    - Retorna alerta criado com HATEOAS links
 *
 * 2. obterAlertas(req, res, next)
 *    - Lista todos os alertas
 *    - Adiciona HATEOAS links
 *    - Retorna total de alertas
 *
 * 3. obterAlertaPorId(req, res, next)
 *    - Obtém alerta específico pelo ID
 *    - Retorna 404 se não encontrado
 *    - Inclui HATEOAS links
 *
 * 4. atualizarAlerta(req, res, next)
 *    - Atualiza campos do alerta
 *    - Permite atualização parcial
 *    - Valida score_risco se fornecido
 *
 * 5. deletarAlerta(req, res, next)
 *    - Deleta alerta por ID
 *    - Retorna mensagem de confirmação
 *
 * 6. obterAlertasPorEstado(req, res, next)
 *    - Filtra alertas por estado
 *    - Estados válidos: ativo, resolvido, cancelado
 *    - Retorna lista filtrada
 */

// ============================================
// ROTAS - ENDPOINTS
// ============================================

/**
 * POST /alertas
 * - Criar novo alerta
 *
 * GET /alertas
 * - Listar todos os alertas
 *
 * GET /alertas/:id
 * - Obter alerta por ID
 *
 * GET /alertas/estado/:estado
 * - Filtrar alertas por estado
 * - Estados: ativo, resolvido, cancelado
 *
 * PUT /alertas/:id
 * - Atualizar alerta
 *
 * DELETE /alertas/:id
 * - Deletar alerta
 */

// ============================================
// VALIDAÇÕES IMPLEMENTADAS
// ============================================

/**
 * Validações de Campo:
 * ✓ idnivel_alerta: Obrigatório, integer, FK
 * ✓ idarea_risco: Obrigatório, integer, FK
 * ✓ idinfraestrutura_urbana: Obrigatório, integer, FK
 * ✓ descricao: Obrigatório, string
 * ✓ score_risco: Obrigatório, 0-100, decimal(5,2)
 * ✓ estado: ENUM (ativo, resolvido, cancelado), default: ativo
 * ✓ data_alerta: DATE, default: NOW
 *
 * Validações de Negócio:
 * ✓ Score de risco deve estar entre 0 e 100
 * ✓ Estado deve ser um dos valores permitidos
 * ✓ Campos obrigatórios na criação
 * ✓ Referências integrais com chaves estrangeiras
 */

// ============================================
// RESPOSTA HATEOAS
// ============================================

/**
 * Todas as respostas incluem links HATEOAS:
 *
 * {
 *     "idalerta": 1,
 *     "descricao": "...",
 *     "score_risco": 85.50,
 *     "estado": "ativo",
 *     "links": {
 *         "self": { "href": "/alertas/1" },
 *         "allAlertas": { "href": "/alertas", "method": "GET" },
 *         "update": { "href": "/alertas/1", "method": "PUT" },
 *         "delete": { "href": "/alertas/1", "method": "DELETE" }
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
 * - Score de risco inválido (fora de 0-100)
 * - Estado inválido
 *
 * 404 Not Found:
 * - Alerta com ID não encontrado
 *
 * 500 Internal Server Error:
 * - Erros genéricos da aplicação
 * - Erros de validação do Sequelize
 */

// ============================================
// ÍNDICES DE BANCO DE DADOS
// ============================================

/**
 * Índices criados:
 * - idalerta (Primary Key, Auto-increment)
 * - idnivel_alerta (Foreign Key)
 * - idarea_risco (Foreign Key)
 * - idinfraestrutura_urbana (Foreign Key)
 * - idx_estado (para filtros por estado)
 * - idx_data_alerta (para ordenação temporal)
 * - idx_score_risco (para filtros por risco)
 */

// ============================================
// INTEGRAÇÃO NO APP.JS
// ============================================

/**
 * O app.js já possui a configuração:
 * 
 * import alertasRoutes from './src/routes/alerta.routes.js';
 * app.use('/alertas', alertasRoutes);
 * 
 * Portanto, todas as rotas estão disponíveis em:
 * http://localhost:3001/alertas
 */
