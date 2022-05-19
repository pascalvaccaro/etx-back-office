module.exports = ({ env }) => ({
  'etx-studio': {
    enabled: true,
    resolve: './src/plugins/etx-studio',
    config: {
      elasticsearch: {
        id: process.env.ELASTICSEARCH_ID,
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
        customerArticlesIndices: {
          fr: 'etx-dailyup-customer-articles-fr',
          en: 'etx-dailyup-customer-articles-en',
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
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {},
        delete: {},
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
  }
});