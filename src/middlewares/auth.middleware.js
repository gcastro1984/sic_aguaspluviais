import jwt from 'jsonwebtoken';

// ─────────────────────────────────────────────
// 1. VERIFICAR TOKEN JWT (autenticação)
// ─────────────────────────────────────────────
export const verifyToken = (req, res, next) => {
  try {
    // 1. Procurar token no header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({
        error: 'no_token',
        error_description: 'No token provided. Use: Authorization: Bearer <token>'
      });

    // 2. Validar formato: Bearer <token>
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token)
      return res.status(401).json({
        error: 'invalid_token_format',
        error_description: 'Invalid authorization format. Use: Bearer <token>'
      });

    // 3. Verificar e descodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Anexar info do utilizador ao request
    req.user = decoded; // { sub: idutilizador, tipo: 'admin'|'operador'|'analista', iat, exp }
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'token_expired', error_description: 'Token has expired.' });
    if (error.name === 'JsonWebTokenError')
      return res.status(401).json({ error: 'invalid_token', error_description: 'Invalid token.' });
    return res.status(401).json({ error: 'auth_error', error_description: 'Error verifying token.' });
  }
};

// ─────────────────────────────────────────────
// 2. AUTORIZAÇÃO POR TIPO DE UTILIZADOR
// ─────────────────────────────────────────────

/**
 * Tipos existentes no model utilizador.tipo:
 *   'administrador'      – acesso total
 *   'operador_municipal' – gere sensores, alertas, leituras, infraestruturas, áreas de risco
 *   'analista_risco'     – acesso de leitura + previsões + relatórios
 */

// Verificar se é administrador
export const requireAdmin = (req, res, next) => {
  if (req.user?.tipo !== 'administrador')
    return res.status(403).json({
      error: 'forbidden',
      error_description: 'Administrador role required.'
    });
  next();
};

// Verificar se é operador_municipal
export const requireOperador = (req, res, next) => {
  if (req.user?.tipo !== 'operador_municipal')
    return res.status(403).json({
      error: 'forbidden',
      error_description: 'Operador Municipal role required.'
    });
  next();
};

// Verificar se é analista_risco
export const requireAnalista = (req, res, next) => {
  if (req.user?.tipo !== 'analista_risco')
    return res.status(403).json({
      error: 'forbidden',
      error_description: 'Analista de Risco role required.'
    });
  next();
};

// Verificar se tem um de vários tipos (ex: requireRole(['admin','operador']))
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.tipo))
      return res.status(403).json({
        error: 'forbidden',
        error_description: `Required role: ${roles.join(' or ')}.`
      });
    next();
  };
};

// Verificar se é admin OU o próprio utilizador
export const requireSelfOrAdmin = (req, res, next) => {
  const userId   = req.user?.sub;
  const userTipo = req.user?.tipo;
  const paramId  = parseInt(req.params.id, 10);

  if (userTipo !== 'administrador' && userId !== paramId)
    return res.status(403).json({
      error: 'forbidden',
      error_description: 'Access denied. You can only access your own data.'
    });
  next();
};
