-- Script SQL para tabela alerta

-- Criar tabela alerta
CREATE TABLE alerta (
    idalerta INT PRIMARY KEY AUTO_INCREMENT,
    idnivel_alerta INT NOT NULL,
    idarea_risco INT NOT NULL,
    idinfraestrutura_urbana INT NOT NULL,
    data_alerta DATETIME DEFAULT CURRENT_TIMESTAMP,
    descricao VARCHAR(255) NOT NULL,
    score_risco DECIMAL(5, 2) NOT NULL,
    estado ENUM('ativo', 'resolvido', 'cancelado') DEFAULT 'ativo',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (idnivel_alerta) REFERENCES nivel_alerta(id),
    FOREIGN KEY (idarea_risco) REFERENCES area_risco(id),
    FOREIGN KEY (idinfraestrutura_urbana) REFERENCES infraestrutura_urbana(id),
    
    INDEX idx_estado (estado),
    INDEX idx_data_alerta (data_alerta),
    INDEX idx_score_risco (score_risco)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exemplos de INSERT

-- Exemplo 1: Alerta ativo com score alto
INSERT INTO alerta (idnivel_alerta, idarea_risco, idinfraestrutura_urbana, data_alerta, descricao, score_risco, estado)
VALUES (1, 1, 1, NOW(), 'Alerta de chuva intensa com risco de inundação', 85.50, 'ativo');

-- Exemplo 2: Alerta resolvido
INSERT INTO alerta (idnivel_alerta, idarea_risco, idinfraestrutura_urbana, data_alerta, descricao, score_risco, estado)
VALUES (2, 2, 2, '2026-05-10 14:30:00', 'Alerta de escoamento inadequado - resolvido', 45.00, 'resolvido');

-- Exemplo 3: Alerta cancelado
INSERT INTO alerta (idnivel_alerta, idarea_risco, idinfraestrutura_urbana, data_alerta, descricao, score_risco, estado)
VALUES (3, 3, 3, '2026-05-09 10:00:00', 'Falso alerta - cancelado', 20.00, 'cancelado');

-- Exemplo 4: Alerta crítico
INSERT INTO alerta (idnivel_alerta, idarea_risco, idinfraestrutura_urbana, data_alerta, descricao, score_risco, estado)
VALUES (1, 1, 1, NOW(), 'Risco crítico de inundação em zona residencial', 95.75, 'ativo');

-- Consultas úteis

-- Contar alertas por estado
SELECT estado, COUNT(*) as total FROM alerta GROUP BY estado;

-- Alertas com score_risco acima de 80
SELECT * FROM alerta WHERE score_risco > 80 ORDER BY score_risco DESC;

-- Alertas ativos nos últimos 7 dias
SELECT * FROM alerta 
WHERE estado = 'ativo' 
AND data_alerta >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY data_alerta DESC;

-- Alertas agrupados por nível de alerta
SELECT idnivel_alerta, COUNT(*) as total_alertas, AVG(score_risco) as score_medio
FROM alerta
GROUP BY idnivel_alerta
ORDER BY total_alertas DESC;

-- Alertas de uma área de risco específica
SELECT * FROM alerta 
WHERE idarea_risco = 1 
ORDER BY data_alerta DESC;
