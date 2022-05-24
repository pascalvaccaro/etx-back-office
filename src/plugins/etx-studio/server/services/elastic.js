const { Client } = require('@elastic/elasticsearch');
const axios = require('axios');
const { Blob } = require('buffer');

const toAttachments = hits => {
  const allAttachments = hits.map(hit => hit._source.imageUrl.map((previewUrl, i) => ({
    name: hit._source.imageTitle[i],
    legend: hit._source.imageDescription[i],
    credits: hit._source.imageCredits[i],
    mime: 'image/jpg',
    previewUrl,
    sourceId: hit._id,
  })));

  return article => allAttachments.filter(attachment => attachment.sourceId === article.source.externalId);
};

const toArticles = async (hits, user) => {
  const categoryNames = hits.map(hit => [hit._source.mainCategory, ...hit._source.categories]);
  const toCategories = await strapi.service('api::category.category').findThenGetByNames(categoryNames);

  return (hit) => ({
    title: hit._source.title,
    header: hit._source.textHeader,
    content: hit._source.textDescription,
    externalUrl: hit._source.sourceUrl,
    categories: toCategories([hit._source.mainCategory, ...hit._source.categories]),
    source: {
      _component: 'providers.etx-studio',
      externalId: hit._id,
      publicationDate: hit._source.publicationDate,
    },
    createdBy: user,
    updatedBy: user,
  });
};

async function* transferFiles(sources, findRefId) {
  for (const attachments of sources) {
    if (!attachments.length) continue;
    const files = await Promise.all(attachments.map(attachment =>
      axios.get(attachment.url, { responseType: 'arraybuffer' })
        .then(file => new Blob([file], { type: attachment.mime }))
    ));
    const { fileInfo, refId } = attachments.reduce((acc, { sourceId, ...attachment }) => ({
      refId: acc.refId || findRefId(sourceId),
      fileInfo: acc.fileInfo.concat(attachment),
    }), { fileInfo: [] });
    const metas = { ref: 'api::article.article', refId, field: 'attachments' };

    yield { files, fileInfo, metas };
  }
}

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

    async transfer(hits, user) {
      const toArticle = await toArticles(hits, user);

      const articles = await Promise.all(
        hits.map(hit => strapi.entityService.create('api::article.article', { data: toArticle(hit) }))
      );
      const attachments = articles.map(toAttachments(hits));
      const finder = (sourceId) => articles.find(article => article.source.externalId === sourceId)?.id || null;

      for await (const { files, metas, fileInfo } of transferFiles(attachments, finder)) {
        await strapi.plugin('upload').service('upload').upload({
          data: { fileInfo, ...metas },
          files,
        });
      }

      return articles;
    }
  };
};