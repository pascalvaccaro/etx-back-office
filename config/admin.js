module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'f33bdfa1eda532257a04efeaefe36247'),
  },
});
