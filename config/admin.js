const { randomBytes } = require('crypto');

module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'f33bdfa1eda532257a04efeaefe36247'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', randomBytes(16).toString('base64')),
  },
});
