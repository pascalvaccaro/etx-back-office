const { Client } = require('@elastic/elasticsearch');

module.exports = ({ strapi }) => {
  let client;
  const { customerArticlesIndices, ...cloud } = strapi.plugin('etx-studio').config('elasticsearch');
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
      return (result.hits || {}).hits || [];
    },


    toAttachments(hits) {
      const allAttachments = hits.map(hit => hit._source.imageUrl.map((url, i) => ({
        name: hit._source.imageTitle[i],
        caption: `${hit._source.imageDescription[i] || ''} :: ${hit._source.imageCredits[i] || ''} :: ${hit._source.imageSpecialUses[i] || ''}`,
        mime: 'image/jpg',
        url,
        sourceId: hit._id,
      }))).flat();

      return (article) => allAttachments.filter(attachment => attachment.sourceId === article.source[0].externalId);
    },

    async toArticles(hits) {
      const categoryNames = hits.map(hit => [hit._source.mainCategory, ...hit._source.categories]);
      const toCategories = await strapi.service('api::category.category').findThenGetByNames(categoryNames);

      return (hit) => ({
        title: hit._source.title,
        header: hit._source.textHeader,
        content: hit._source.textDescription,
        externalUrl: hit._source.sourceUrl,
        categories: toCategories([hit._source.mainCategory, ...hit._source.categories]),
        source: [{
          __component: 'providers.elastic',
          externalId: hit._id,
        }],
        publishedAt: new Date(hit._source.publicationDate),
      });
    },

    toLocales() {
      return (hit) => (hit._source.language || 'fr').slice(0, 2);
    }
  };
};