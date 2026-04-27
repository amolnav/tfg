
const jwt = require('jsonwebtoken');
const { BusinessError } = require('./errorHandler');
const { asyncHandler } = require('./errorHandler');
const { JWT_SECRET } = require('../config/auth');

/**
 * Middleware de autenticación JWT.
 * Verifica el token en el header Authorization: Bearer <token>
 */
const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new BusinessError(
      'Acceso no autorizado. Se requiere autenticación.',
      'UNAUTHORIZED',
      401
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Adjuntar usuario decodificado a la request
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new BusinessError(
        'La sesión ha expirado. Por favor, inicia sesión de nuevo.',
        'TOKEN_EXPIRED',
        401
      );
    }
    throw new BusinessError(
      'Token de autenticación inválido.',
      'INVALID_TOKEN',
      401
    );
  }
});

module.exports = { authMiddleware };
