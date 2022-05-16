module.exports = ({ env }) => {
  const serverConfig = {
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    app: {
      keys: env.array('APP_KEYS'),
    },
    cron: {
      enabled: true,
    },
  };

  if (env.bool('STAGING_ENV')) {
    serverConfig.url = env('RENDER_EXTERNAL_URL');
    serverConfig.dirs = {
      public: '/data/public',
    };
  }

  return serverConfig;
};
