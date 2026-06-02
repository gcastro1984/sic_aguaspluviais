import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel, ShadingType, convertInchesToTwip } from 'docx';
import { writeFileSync } from 'fs';

// ─── Cores por método HTTP ────────────────────────────────────────────────────
const METHOD_COLOR = {
    GET:    '2563EB', // azul
    POST:   '16A34A', // verde
    PATCH:  'D97706', // laranja
    DELETE: 'DC2626', // vermelho
};

// ─── Utilitários de formatação ────────────────────────────────────────────────
const badge = (method) => new TextRun({
    text: ` ${method} `,
    bold: true,
    color: 'FFFFFF',
    highlight: undefined,
    shading: { type: ShadingType.SOLID, color: METHOD_COLOR[method] || '6B7280' },
    font: 'Courier New',
    size: 18,
});

const mono = (text, color) => new TextRun({ text, font: 'Courier New', size: 18, color: color || '1E293B' });
const bold = (text, size) => new TextRun({ text, bold: true, size: size || 22 });
const dim  = (text) => new TextRun({ text, color: '64748B', size: 18 });

const heading1 = (text) => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
});

const heading2 = (text) => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
});

const p = (runs, spacing) => new Paragraph({
    children: Array.isArray(runs) ? runs : [runs],
    spacing: spacing || { after: 80 },
});

const labelRow = (label, value) => new TableRow({
    children: [
        new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: 'F1F5F9' },
            children: [p(bold(label, 18))],
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
        new TableCell({
            width: { size: 78, type: WidthType.PERCENTAGE },
            children: [p(Array.isArray(value) ? value : [value])],
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
    ],
});

const endpointTable = (rows) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
        top:           { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        bottom:        { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        left:          { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        right:         { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        insideH:       { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        insideV:       { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    },
    rows,
});

const divider = () => new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } },
    spacing: { before: 200, after: 200 },
    children: [],
});

// ─── Definição dos endpoints ──────────────────────────────────────────────────
const API = [
    {
        section: '1. Autenticação',
        endpoints: [
            {
                method: 'POST', path: '/utilizadores/login', auth: 'Pública',
                desc: 'Autentica o utilizador. Devolve um access token JWT de curta duração (15 min) no body e define um cookie httpOnly com o refresh token (1 dia).',
                body: { email: 'admin@exemplo.pt', password: 'password123' },
                response: '200 OK — { accessToken, tipo }\n401 — Email ou password inválidos',
            },
            {
                method: 'POST', path: '/utilizadores/refresh', auth: 'Pública (cookie httpOnly)',
                desc: 'Renova o access token usando o refresh token guardado no cookie httpOnly. O browser envia o cookie automaticamente; não é necessário body.',
                body: null,
                response: '200 OK — { accessToken }\n401 — Refresh token em falta\n403 — Refresh token inválido ou expirado',
            },
            {
                method: 'POST', path: '/utilizadores/logout', auth: 'Bearer token',
                desc: 'Termina a sessão: revoga o refresh token na base de dados e limpa o cookie httpOnly.',
                body: null,
                response: '200 OK — { message: "Logout successful." }',
            },
        ],
    },
    {
        section: '2. Utilizadores',
        endpoints: [
            {
                method: 'GET', path: '/utilizadores', auth: 'administrador',
                desc: 'Lista todos os utilizadores com paginação.',
                query: '?page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'POST', path: '/utilizadores', auth: 'administrador',
                desc: 'Cria um novo utilizador no sistema.',
                body: { email: 'novo@exemplo.pt', password: 'pass12345', tipo: 'operador_municipal' },
                response: '201 — { _self: "/utilizadores/{id}" }\n409 — Email já em uso',
            },
            {
                method: 'GET', path: '/utilizadores/:id', auth: 'administrador ou próprio',
                desc: 'Devolve os dados de um utilizador pelo ID.',
                response: '200 — { idutilizador, email, tipo, _links }\n404 — Não encontrado',
            },
            {
                method: 'PATCH', path: '/utilizadores/:id', auth: 'administrador ou próprio',
                desc: 'Edição parcial: email, password e/ou tipo. Não-admin não pode alterar o tipo. Verifica duplicado de email antes de atualizar.',
                body: { email: 'novo@exemplo.pt', password: 'novapass', tipo: 'analista_risco' },
                response: '200 — { idutilizador, email, tipo, _links }\n409 — Email em uso',
            },
            {
                method: 'DELETE', path: '/utilizadores/:id', auth: 'administrador',
                desc: 'Apaga o utilizador. Bloqueia se for o único administrador ou se tiver relatórios associados.',
                response: '204 — Sem conteúdo\n409 — Único admin / tem relatórios',
            },
        ],
    },
    {
        section: '3. Sensores',
        endpoints: [
            {
                method: 'GET', path: '/sensores', auth: 'Pública',
                desc: 'Lista sensores com paginação. Filtro opcional por status.',
                query: '?status=online|offline|manutencao&page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/sensores/:id', auth: 'Pública',
                desc: 'Devolve um sensor específico pelo ID.',
                response: '200 — { idsensor, tipo, localizacao, status, ... }\n404 — Não encontrado',
            },
            {
                method: 'POST', path: '/sensores', auth: 'administrador, operador_municipal',
                desc: 'Cria um novo sensor. Tipos válidos: nivel_agua, precipitacao, caudal, temperatura, humidade.',
                body: { tipo: 'precipitacao', localizacao: 'Rua das Flores, Porto', status: 'online', idinfraestrutura_urbana: 1 },
                response: '201 — { _self: "/sensores/{id}" }',
            },
            {
                method: 'PATCH', path: '/sensores/:id', auth: 'administrador, operador_municipal',
                desc: 'Atualização parcial do sensor (tipo, localização, status, manutenção).',
                body: { status: 'manutencao', data_proxima_manutencao: '2026-12-01' },
                response: '200 — sensor atualizado\n404 — Não encontrado',
            },
            {
                method: 'DELETE', path: '/sensores/:id', auth: 'administrador, operador_municipal',
                desc: 'Apaga o sensor. CASCADE: apaga automaticamente todas as leituras e alertas associados.',
                response: '204 — Sem conteúdo',
            },
        ],
    },
    {
        section: '4. Leituras de Sensor',
        endpoints: [
            {
                method: 'GET', path: '/leituras', auth: 'Pública',
                desc: 'Lista leituras com paginação.',
                query: '?page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/leituras/sensor/:idsensor', auth: 'Pública',
                desc: 'Lista leituras de um sensor específico.',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/leituras/:id', auth: 'Pública',
                desc: 'Devolve uma leitura pelo ID.',
                response: '200 — { idleitura_sensor, idsensor, tipo_variavel, valor, ... }\n404 — Não encontrado',
            },
            {
                method: 'POST', path: '/leituras', auth: 'administrador, operador_municipal',
                desc: 'Regista uma nova leitura. Se o valor ultrapassar os critérios de alerta, cria automaticamente um alerta e envia email aos destinatários.',
                body: { idsensor: 1, tipo_variavel: 'precipitacao', valor: 75.5, unidade: 'mm', data_observacao: '2026-06-02T10:00:00Z' },
                response: '201 — { _self: "/leituras/{id}" }',
            },
            {
                method: 'DELETE', path: '/leituras/:id', auth: 'administrador, operador_municipal',
                desc: 'Apaga a leitura. CASCADE: apaga o alerta associado.',
                response: '204 — Sem conteúdo',
            },
        ],
    },
    {
        section: '5. Alertas',
        endpoints: [
            {
                method: 'GET', path: '/alertas', auth: 'Pública',
                desc: 'Lista alertas com paginação.',
                query: '?estado=ativo|resolvido|falso_positivo&page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/alertas/:id', auth: 'Pública',
                desc: 'Devolve um alerta com dados completos (área de risco, nível, infraestrutura, previsões).',
                response: '200 — objeto alerta completo com includes\n404 — Não encontrado',
            },
            {
                method: 'POST', path: '/alertas', auth: 'administrador, operador_municipal',
                desc: 'Processa uma leitura e cria ou atualiza um alerta automaticamente com base nos critérios definidos.',
                body: { idleitura_sensor: 42 },
                response: '201 — { _self } ou 200 — alerta atualizado/sem alteração',
            },
            {
                method: 'PATCH', path: '/alertas/:id', auth: 'administrador, operador_municipal',
                desc: 'Atualiza o estado ou dados do alerta. Não é possível resolver se existirem planos pendentes/ativos.',
                body: { estado: 'resolvido', descricao: 'Situação normalizada' },
                response: '200 — alerta atualizado\n409 — Planos ativos bloqueiam resolução',
            },
            {
                method: 'DELETE', path: '/alertas/:id', auth: 'administrador, operador_municipal',
                desc: 'Apaga o alerta. Bloqueia se existirem notificações, relatórios ou planos de ação associados.',
                response: '204 — Sem conteúdo\n409 — Registos dependentes existem',
            },
        ],
    },
    {
        section: '6. Áreas de Risco',
        endpoints: [
            {
                method: 'GET', path: '/areas-risco', auth: 'Pública',
                desc: 'Lista áreas de risco com paginação.',
                query: '?vulnerabilidade=1-5&page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/areas-risco/:id', auth: 'Pública',
                desc: 'Devolve uma área de risco pelo ID.',
                response: '200 — { idarea_risco, nome, localizacao, vulnerabilidade_base, ... }\n404 — Não encontrado',
            },
            {
                method: 'POST', path: '/areas-risco', auth: 'administrador, operador_municipal',
                desc: 'Cria uma nova área de risco. Vulnerabilidade base: 1 (Baixa) a 5 (Crítica).',
                body: { nome: 'Zona Ribeirinha', localizacao: 'Porto Norte', vulnerabilidade_base: 3, descricao: 'Junto ao Rio Douro' },
                response: '201 — { _self: "/areas-risco/{id}" }',
            },
            {
                method: 'PATCH', path: '/areas-risco/:id', auth: 'administrador, operador_municipal',
                desc: 'Atualização parcial da área de risco.',
                body: { vulnerabilidade_base: 4 },
                response: '200 — área atualizada',
            },
            {
                method: 'DELETE', path: '/areas-risco/:id', auth: 'administrador, operador_municipal',
                desc: 'Apaga a área de risco. Bloqueia se existirem infraestruturas associadas. CASCADE para previsões meteorológicas.',
                response: '204 — Sem conteúdo\n409 — Infraestruturas associadas existem',
            },
        ],
    },
    {
        section: '7. Infraestruturas Urbanas',
        endpoints: [
            {
                method: 'GET', path: '/infraestruturas', auth: 'Pública',
                desc: 'Lista infraestruturas com paginação.',
                query: '?idarea_risco=1&tipo=bueiro|valeta|barragem|canal|reservatorio&page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/infraestruturas/:id', auth: 'Pública',
                desc: 'Devolve uma infraestrutura pelo ID.',
                response: '200 — { idinfraestrutura_urbana, nome, tipo, localizacao, idarea_risco }\n404 — Não encontrado',
            },
            {
                method: 'POST', path: '/infraestruturas', auth: 'administrador, operador_municipal',
                desc: 'Cria uma nova infraestrutura urbana.',
                body: { nome: 'Bueiro Central', tipo: 'bueiro', localizacao: 'Av. dos Aliados', idarea_risco: 1 },
                response: '201 — { _self: "/infraestruturas/{id}" }',
            },
            {
                method: 'PATCH', path: '/infraestruturas/:id', auth: 'administrador, operador_municipal',
                desc: 'Atualização parcial da infraestrutura.',
                body: { tipo: 'canal', localizacao: 'Nova morada' },
                response: '200 — infraestrutura atualizada',
            },
            {
                method: 'DELETE', path: '/infraestruturas/:id', auth: 'administrador, operador_municipal',
                desc: 'Apaga a infraestrutura. Bloqueia se existirem sensores associados.',
                response: '204 — Sem conteúdo\n409 — Sensores associados existem',
            },
        ],
    },
    {
        section: '8. Previsões Meteorológicas',
        endpoints: [
            {
                method: 'GET', path: '/previsoes', auth: 'Pública',
                desc: 'Lista previsões com paginação.',
                query: '?idarea_risco=1&confianca_minima=0.8&page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/previsoes/:id', auth: 'Pública',
                desc: 'Devolve uma previsão pelo ID.',
                response: '200 — { idprevisao, idarea_risco, fonte, precipitacao_prevista_mm, confianca, ... }\n404 — Não encontrado',
            },
            {
                method: 'POST', path: '/previsoes', auth: 'administrador, analista_risco',
                desc: 'Cria uma nova previsão meteorológica. Confiança: 0.0 a 1.0.',
                body: { idarea_risco: 1, fonte: 'IPMA', precipitacao_prevista_mm: 25.0, confianca: 0.85, horizonte_horas: 24, data_inicio_previsao: '2026-06-03T00:00:00Z', data_fim_previsao: '2026-06-04T00:00:00Z' },
                response: '201 — { _self: "/previsoes/{id}" }',
            },
            {
                method: 'PATCH', path: '/previsoes/:id', auth: 'administrador, analista_risco',
                desc: 'Atualização parcial da previsão.',
                body: { confianca: 0.9 },
                response: '200 — previsão atualizada',
            },
            {
                method: 'DELETE', path: '/previsoes/:id', auth: 'administrador, analista_risco',
                desc: 'Apaga a previsão meteorológica.',
                response: '204 — Sem conteúdo',
            },
        ],
    },
    {
        section: '9. Planos de Ação',
        endpoints: [
            {
                method: 'GET', path: '/planos-acao', auth: 'Pública',
                desc: 'Lista planos de ação com paginação.',
                query: '?page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/planos-acao/:id', auth: 'Pública',
                desc: 'Devolve um plano de ação pelo ID.',
                response: '200 — { idplano_acao, descricao, tipo_destinatario }\n404 — Não encontrado',
            },
            {
                method: 'POST', path: '/planos-acao', auth: 'administrador, operador_municipal',
                desc: 'Cria um novo plano de ação. Tipos de destinatário: tecnico, responsavel, cidadao, autoridade.',
                body: { descricao: 'Evacuação preventiva da Zona A', tipo_destinatario: 'tecnico' },
                response: '201 — { _self: "/planos-acao/{id}" }',
            },
            {
                method: 'PATCH', path: '/planos-acao/:id', auth: 'administrador, operador_municipal',
                desc: 'Atualização parcial do plano de ação.',
                body: { descricao: 'Nova descrição do plano', tipo_destinatario: 'responsavel' },
                response: '200 — plano atualizado',
            },
            {
                method: 'DELETE', path: '/planos-acao/:id', auth: 'administrador, operador_municipal',
                desc: 'Apaga o plano de ação. Bloqueia se estiver associado a níveis de alerta.',
                response: '204 — Sem conteúdo\n409 — Associado a níveis de alerta',
            },
        ],
    },
    {
        section: '10. Nível de Alerta ↔ Plano de Ação',
        endpoints: [
            {
                method: 'GET', path: '/planos-alerta', auth: 'Pública',
                desc: 'Lista associações entre níveis de alerta e planos de ação. Inclui dados do nível e do plano.',
                query: '?idnivel_alerta=2&idplano_acao=1&page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/planos-alerta/:idplano/:idnivel', auth: 'Bearer token',
                desc: 'Devolve uma associação específica pelos dois IDs.',
                response: '200 — { idplano_acao, idnivel_alerta, plano_acao, nivel_alerta }\n404 — Não encontrada',
            },
            {
                method: 'POST', path: '/planos-alerta', auth: 'administrador, operador_municipal',
                desc: 'Cria uma associação entre um nível de alerta e um plano de ação. Verifica duplicados.',
                body: { idnivel_alerta: 3, idplano_acao: 1 },
                response: '201 — { _self: "/planos-alerta/{idplano}/{idnivel}" }\n422 — Associação já existe',
            },
            {
                method: 'DELETE', path: '/planos-alerta/:idplano/:idnivel', auth: 'administrador, operador_municipal',
                desc: 'Remove a associação entre nível de alerta e plano de ação.',
                response: '204 — Sem conteúdo\n404 — Não encontrada',
            },
        ],
    },
    {
        section: '11. Alerta ↔ Plano de Ação (Execução)',
        endpoints: [
            {
                method: 'GET', path: '/alertas-planos', auth: 'Pública',
                desc: 'Lista associações alerta-plano em execução com paginação.',
                query: '?estado=pendente|ativo|concluido|cancelado&idalerta=1&idplano_acao=2&page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/alertas-planos/:idalerta/:idplano', auth: 'Pública',
                desc: 'Devolve uma associação alerta-plano específica com dados completos.',
                response: '200 — objeto com alerta, plano e infraestrutura\n404 — Não encontrada',
            },
            {
                method: 'POST', path: '/alertas-planos', auth: 'administrador, operador_municipal',
                desc: 'Associa um plano de ação a um alerta ativo. Estados válidos: pendente, ativo, concluido, cancelado.',
                body: { idalerta: 1, idplano_acao: 2, estado: 'pendente', responsavel: 'João Silva', observacoes: 'Notificação enviada' },
                response: '201 — { _self }\n409 — Associação já existe',
            },
            {
                method: 'PATCH', path: '/alertas-planos/:idalerta/:idplano', auth: 'administrador, operador_municipal',
                desc: 'Atualiza o estado da execução do plano. Ao passar para "ativo" regista data_inicio automática; ao "concluido" regista data_conclusao.',
                body: { estado: 'concluido', observacoes: 'Plano executado com sucesso' },
                response: '200 — associação atualizada',
            },
            {
                method: 'DELETE', path: '/alertas-planos/:idalerta/:idplano', auth: 'administrador, operador_municipal',
                desc: 'Remove a associação alerta-plano.',
                response: '204 — Sem conteúdo',
            },
        ],
    },
    {
        section: '12. Destinatários',
        endpoints: [
            {
                method: 'GET', path: '/destinatarios', auth: 'Pública',
                desc: 'Lista destinatários de notificações com paginação.',
                query: '?page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/destinatarios/:id', auth: 'Bearer token',
                desc: 'Devolve um destinatário pelo ID.',
                response: '200 — { iddestinatario, nome, email, contato, tipo }\n404 — Não encontrado',
            },
            {
                method: 'POST', path: '/destinatarios', auth: 'administrador',
                desc: 'Cria um novo destinatário. Tipos: tecnico, responsavel, cidadao, entidade. Email único.',
                body: { nome: 'João Silva', email: 'joao@exemplo.pt', contato: '+351912345678', tipo: 'tecnico' },
                response: '201 — { _self: "/destinatarios/{id}" }\n409 — Email já em uso',
            },
            {
                method: 'PATCH', path: '/destinatarios/:id', auth: 'administrador',
                desc: 'Atualização parcial do destinatário.',
                body: { contato: '+351987654321', tipo: 'responsavel' },
                response: '200 — destinatário atualizado',
            },
            {
                method: 'DELETE', path: '/destinatarios/:id', auth: 'administrador',
                desc: 'Apaga o destinatário. Bloqueia se existirem notificações associadas.',
                response: '204 — Sem conteúdo\n409 — Tem notificações associadas',
            },
        ],
    },
    {
        section: '13. Notificações',
        endpoints: [
            {
                method: 'GET', path: '/notificacoes', auth: 'Pública',
                desc: 'Lista notificações ordenadas pela mais recente. Paginação de 10 por página.',
                query: '?page=1&limit=10',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/notificacoes/:id', auth: 'Pública',
                desc: 'Devolve uma notificação pelo ID com dados do alerta e do destinatário.',
                response: '200 — objeto notificação com includes\n404 — Não encontrada',
            },
            {
                method: 'POST', path: '/notificacoes', auth: 'Bearer token',
                desc: 'Modo direto: notifica um destinatário específico. Canais: email, sms, push.',
                body: { idalerta: 1, iddestinatario: 2, canal: 'email', estado_envio: 'pendente', mensagem: 'Alerta de inundação ativo na Zona A.' },
                response: '201 — { _self: "/notificacoes/{id}" }',
            },
            {
                method: 'POST', path: '/notificacoes (por sensor)', auth: 'Bearer token',
                desc: 'Modo sensor: notifica automaticamente todos os destinatários do tipo "responsavel".',
                body: { idsensor: 1, canal: 'email', observacoes: 'Calibração prevista para amanhã' },
                response: '201 — { message, data: [notificações criadas] }',
            },
            {
                method: 'PATCH', path: '/notificacoes/:id', auth: 'Bearer token',
                desc: 'Atualiza o estado de envio da notificação.',
                body: { estado_envio: 'enviado', data_confirmacao: '2026-06-02T10:30:00Z' },
                response: '200 — notificação atualizada',
            },
            {
                method: 'DELETE', path: '/notificacoes/:id', auth: 'Bearer token',
                desc: 'Apaga a notificação.',
                response: '204 — Sem conteúdo',
            },
        ],
    },
    {
        section: '14. Relatórios',
        endpoints: [
            {
                method: 'GET', path: '/relatorios', auth: 'Bearer token',
                desc: 'Lista relatórios com paginação, ordenados por data descendente.',
                query: '?idalerta=1&idutilizador=2&page=1&limit=20',
                response: '200 / 206 — { data: [...], pagination }',
            },
            {
                method: 'GET', path: '/relatorios/:id', auth: 'Bearer token',
                desc: 'Devolve um relatório pelo ID com utilizador e alerta associados.',
                response: '200 — { idrelatorio, descricao, data, Utilizador, Alerta }\n404 — Não encontrado',
            },
            {
                method: 'POST', path: '/relatorios', auth: 'Bearer token',
                desc: 'Cria um relatório manualmente. São também criados automaticamente pelo sistema quando uma leitura gera alerta de nível > 1.',
                body: { descricao: 'Análise de ocorrência na Zona Ribeirinha', idutilizador: 1, idalerta: 5 },
                response: '201 — { _self: "/relatorios/{id}" }',
            },
            {
                method: 'PATCH', path: '/relatorios/:id', auth: 'Bearer token',
                desc: 'Atualização parcial do relatório.',
                body: { descricao: 'Descrição corrigida' },
                response: '200 — relatório atualizado',
            },
            {
                method: 'DELETE', path: '/relatorios/:id', auth: 'Bearer token',
                desc: 'Apaga o relatório.',
                response: '204 — Sem conteúdo',
            },
        ],
    },
];

// ─── Erros comuns ─────────────────────────────────────────────────────────────
const ERRORS = [
    ['400 Bad Request',           'Campos obrigatórios em falta.'],
    ['401 Unauthorized',          'Token ausente, inválido ou expirado.'],
    ['403 Forbidden',             'Papel (role) insuficiente para a operação.'],
    ['404 Not Found',             'Recurso não encontrado pelo ID indicado.'],
    ['409 Conflict',              'Violação de unicidade ou dependência que impede a operação.'],
    ['422 Unprocessable Entity',  'Dados enviados são inválidos (formato, intervalo, duplicado).'],
    ['500 Internal Server Error', 'Erro inesperado no servidor.'],
];

// ─── Construção do documento ──────────────────────────────────────────────────
const children = [];

// Capa
children.push(
    new Paragraph({ children: [], spacing: { after: 1200 } }),
    new Paragraph({
        children: [new TextRun({ text: 'SIC · Águas Pluviais', bold: true, size: 52, color: '1E40AF', font: 'DM Sans' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
    }),
    new Paragraph({
        children: [new TextRun({ text: 'Documentação da API REST', size: 36, color: '374151' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
    }),
    new Paragraph({
        children: [dim('Versão 1.0 · Junho 2026 · Base URL: http://localhost:3001')],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
    }),
    divider(),
);

// Visão geral
children.push(
    heading1('Visão Geral'),
    p([new TextRun({ text: 'A API SIC Águas Pluviais segue o estilo REST com respostas em JSON. A autenticação usa JWT com dois tokens:', size: 20 })]),
    p([mono('  • Access Token'), new TextRun({ text: ' — curta duração (15 min), enviado no header ', size: 18 }), mono('Authorization: Bearer <token>'), new TextRun({ text: '.', size: 18 })]),
    p([mono('  • Refresh Token'), new TextRun({ text: ' — longa duração (1 dia), cookie HttpOnly. Renovação automática via ', size: 18 }), mono('POST /utilizadores/refresh'), new TextRun({ text: '.', size: 18 })]),
    new Paragraph({ spacing: { after: 120 } }),
    p(bold('Roles disponíveis:', 20)),
    p([mono('  administrador'), dim(' — acesso total')]),
    p([mono('  operador_municipal'), dim(' — sensores, leituras, alertas, infraestruturas, áreas de risco')]),
    p([mono('  analista_risco'), dim(' — leitura + previsões + relatórios')]),
    new Paragraph({ spacing: { after: 120 } }),
    p(bold('Formato de erro:', 20)),
    p(mono('{ "error": "código", "error_description": "mensagem", "errors": {...} }')),
    new Paragraph({ spacing: { after: 120 } }),
    p(bold('Paginação:', 20)),
    p([new TextRun({ text: 'Parâmetros: ', size: 18 }), mono('?page=1&limit=20'), new TextRun({ text: ' ou ', size: 18 }), mono('?offset=0&limit=20'), new TextRun({ text: '. Resposta inclui: ', size: 18 }), mono('{ total, page, limit, pages }'), new TextRun({ text: '. HTTP 206 quando há mais páginas.', size: 18 })]),
    divider(),
);

// Secções de endpoints
for (const group of API) {
    children.push(heading1(group.section));

    for (const ep of group.endpoints) {
        // Título do endpoint
        children.push(new Paragraph({
            children: [badge(ep.method), new TextRun({ text: '  ' }), mono(ep.path, '0F172A')],
            spacing: { before: 240, after: 80 },
        }));

        // Tabela de detalhes
        const rows = [
            labelRow('Descrição',    new TextRun({ text: ep.desc, size: 18 })),
            labelRow('Auth',         mono(ep.auth, ep.auth === 'Pública' ? '16A34A' : '1D4ED8')),
        ];
        if (ep.query)  rows.push(labelRow('Query params', mono(ep.query)));
        if (ep.body)   rows.push(labelRow('Body (JSON)',  mono(JSON.stringify(ep.body, null, 2))));
        rows.push(      labelRow('Respostas',   mono(ep.response)));

        children.push(endpointTable(rows));
        children.push(new Paragraph({ spacing: { after: 160 } }));
    }

    children.push(divider());
}

// Tabela de erros comuns
children.push(heading1('Códigos de Resposta HTTP'));
children.push(endpointTable(
    ERRORS.map(([code, desc]) => new TableRow({
        children: [
            new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.SOLID, color: 'FEF2F2' },
                children: [p(mono(code, 'DC2626'))],
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
            }),
            new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [p(new TextRun({ text: desc, size: 18 }))],
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
            }),
        ],
    }))
));

// ─── Gera o ficheiro ──────────────────────────────────────────────────────────
const doc = new Document({
    creator: 'SIC Águas Pluviais',
    title:   'API Documentation',
    styles: {
        paragraphStyles: [
            {
                id: 'Heading1',
                name: 'Heading 1',
                run: { size: 28, bold: true, color: '1E40AF', font: 'DM Sans' },
                paragraph: { spacing: { before: 400, after: 160 } },
            },
            {
                id: 'Heading2',
                name: 'Heading 2',
                run: { size: 24, bold: true, color: '374151' },
                paragraph: { spacing: { before: 280, after: 120 } },
            },
        ],
    },
    sections: [{ children }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('docs/SIC_API_Documentacao.docx', buffer);
console.log('✅  Documento gerado: docs/SIC_API_Documentacao.docx');
