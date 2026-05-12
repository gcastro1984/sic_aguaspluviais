-- Script SQL para tabela area_risco

-- Criar tabela area_risco
CREATE TABLE area_risco (
    idarea_risco INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL UNIQUE,
    localizacao VARCHAR(255) NOT NULL,
    vulnerabilidade_base INT NOT NULL,
    descricao TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_vulnerabilidade CHECK (vulnerabilidade_base >= 1 AND vulnerabilidade_base <= 5),
    
    INDEX idx_vulnerabilidade (vulnerabilidade_base),
    INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exemplos de INSERT baseados no CSV

INSERT INTO area_risco (nome, localizacao, vulnerabilidade_base, descricao)
VALUES (
    'Zona Ribeirinha',
    'Vila do Conde - Marginal e Rio Ave',
    5,
    'Área baixa próxima do rio, sensível a maré cheia e precipitação acumulada.'
);

INSERT INTO area_risco (nome, localizacao, vulnerabilidade_base, descricao)
VALUES (
    'Passagem Inferior',
    'Vila do Conde - Acesso rodoviário inferior',
    4,
    'Zona com histórico de acumulação rápida de água em eventos intensos.'
);

INSERT INTO area_risco (nome, localizacao, vulnerabilidade_base, descricao)
VALUES (
    'Centro Urbano',
    'Vila do Conde - Centro',
    3,
    'Zona urbana impermeabilizada, com risco de lençóis de água.'
);

INSERT INTO area_risco (nome, localizacao, vulnerabilidade_base, descricao)
VALUES (
    'Zona Industrial',
    'Vila do Conde - Área industrial',
    2,
    'Zona com risco moderado e dependente da capacidade de drenagem.'
);

-- Consultas úteis

-- Contar áreas por nível de vulnerabilidade
SELECT vulnerabilidade_base, COUNT(*) as total FROM area_risco GROUP BY vulnerabilidade_base ORDER BY vulnerabilidade_base DESC;

-- Áreas com alta vulnerabilidade (4-5)
SELECT * FROM area_risco WHERE vulnerabilidade_base >= 4 ORDER BY vulnerabilidade_base DESC;

-- Buscar área específica por nome
SELECT * FROM area_risco WHERE nome LIKE '%Ribeirinha%';

-- Todas as áreas ordenadas por vulnerabilidade
SELECT * FROM area_risco ORDER BY vulnerabilidade_base DESC;

-- Contar total de áreas
SELECT COUNT(*) as total_areas FROM area_risco;

-- Áreas com vulnerabilidade média (3)
SELECT * FROM area_risco WHERE vulnerabilidade_base = 3;
