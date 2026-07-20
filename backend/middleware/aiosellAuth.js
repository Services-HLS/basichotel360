const aiosellService = require('../services/aiosellService');

function parseBasicAuth(headerValue) {
  if (!headerValue || !headerValue.startsWith('Basic ')) {
    return null;
  }

  const decoded = Buffer.from(headerValue.slice(6), 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');

  if (separatorIndex === -1) {
    return { username: decoded, password: '' };
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
}

function aiosellBasicAuth(req, res, next) {
  const credentials = parseBasicAuth(req.headers.authorization);
  const config = aiosellService.getWebhookConfig();

  if (!credentials) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  if (
    credentials.username !== config.username ||
    credentials.password !== config.password
  ) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  return next();
}

function validateAiosellEndpointKey(req, res, next) {
  const config = aiosellService.getWebhookConfig();

  if (req.params.endpointKey !== config.endpointKey) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint not found',
    });
  }

  return next();
}

module.exports = {
  aiosellBasicAuth,
  validateAiosellEndpointKey,
};
