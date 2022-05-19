const { Client } = require('@elastic/elasticsearch');

const toMedias = source => source.imageUrl.map((url, i) => ({
  file: {
    url,
    name: source.imageTitle[i],
    provider: ''
  },
  credits: source.imageCredits[i],
  description: source.imageDescription[i],
  name: source.imageTitle[i]
}));

module.exports = ({ strapi }) => {
  let client;
  const { customerArticlesIndices, ...cloud } = strapi.plugin('etx-studio').config.get('elasticsearch');
  try {
    client = new Client({ cloud });
  } catch (err) {
    strapi.log.error(err);
    client = null;
  }

  return {
    async search(query) {
      if (!client) return [];

      const { locale = 'fr', from = 0 } = query;
      const payload = {
        index: customerArticlesIndices[locale.slice(0, 2)],
        body: {
          size: 10,
          from,
          sort: ['_score', { publicationDate: 'desc' }],
          query
        }
      };
      const result = await client.search(payload);

      const categoryNames = result.hits.hits
        .map(hit => [hit._source.mainCategory, ...hit._source.categories]);
      const toCategories = await strapi.service('api::category.category').findThenGetByNames(categoryNames);

      return result.hits.hits.map(hit => ({
        title: hit._source.title,
        header: hit._source.textHeader,
        content: hit._source.textDescription,
        categories: toCategories([hit._source.mainCategory, ...hit._source.categories]),
        medias: toMedias(hit._source),
        metadatas: {
          signature: hit._source.signature,
          publicationDate: hit._source.publicationDate,
          externalId: hit._id,
          url: hit._source.sourceUrl,
          provider: hit._source.platformName,
        }
      }));
    }
  };
};