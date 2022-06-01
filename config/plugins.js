module.exports = ({ env }) => ({
  'etx-studio': {
    enabled: true,
    resolve: './src/plugins/etx-studio',
    config: {
      elasticsearch: {
        id: env('ELASTICSEARCH_ID', ''),
        username: env('ELASTICSEARCH_USERNAME', ''),
        password: env('ELASTICSEARCH_PASSWORD', ''),
        customerArticlesIndices: {
          fr: 'etx-dailyup-customer-articles-fr',
          en: 'etx-dailyup-customer-articles-en',
        }
      },
      dynamodb: {
        config: {
          endpoint: env('DDB_ENDPOINT', 'https://dynamodb.eu-west-1.amazonaws.com'),
          region: env('DDB_REGION', 'eu-west-1'),
          credentials: {
            accessKeyId: env('DDB_KEY', ''),
            secretAccessKey: env('DDB_SECRET', '')
          }
        },
        articlesTable: env('DDB_TABLENAME', 'ETX-WCM-AFP-RELAX-DEV')
      },
      samba: {
        domain: env('SAMBA_DOMAIN', 'https://samba.etx.studio'),
        email: env('SAMBA_EMAIL', ''),
        password: env('SAMBA_PASSWORD', '')
      },
      wcm: {
        mysql: {
          host: env('WCM_MYSQL_HOST', 'localhost'),
          user: env('WCM_MYSQL_USER', ''),
          password: env('WCM_MYSQL_PASSWORD', ''),
          database: env('WCM_MYSQL_DATABASE', 'RELAX_BIZ')
        }
      }
    }
  },
  'wysiwyg': {
    enabled: true,
    resolve: './src/plugins/wysiwyg'
  },
  'publisher': {
    enabled: true,
  },
  'entity-notes': {
    enabled: true,
  },
  upload: {
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 20000,
      },
    },
  },
  deepl: {
    enabled: true,
    config: {
      // your DeepL API key
      apiKey: env('DEEPL_API_KEY', ''),
      // whether to use the free or paid api, default true
      freeApi: true,
      // Which field types are translated (default string, text, richtext, components and dynamiczones)
      translatedFieldTypes: [
        'string',
        'text',
        'richtext',
        'component',
        'dynamiczone',
      ],
      // If relations should be translated (default true)
      translateRelations: true,
      // You can define a custom glossary to be used here (see https://www.deepl.com/docs-api/managing-glossaries/)
      // glossaryId: 'customGlossary',
    },
  },
  'config-sync': {
    enabled: true,
    config: {
      customTypes: [
        { configName: 'categories', queryString: 'api::category.category', uid: ['slug', 'locale'] },
        { configName: 'intents', queryString: 'api::intent.intent', uid: ['slug', 'locale'] },
        { configName: 'zones', queryString: 'api::zone.zone', uid: ['code', 'locale'] },
      ]
    }
  }
});