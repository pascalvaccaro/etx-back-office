const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { ValidationError } = require('@strapi/utils').errors;

const toImages = (attachments) => attachments
  .filter(attachment => attachment.file.mime.startsWith('image/'))
  .reduce((acc, c) => ({
    imageUrl: [...acc.imageUrl, c.file.url],
    imageTitle: [...acc.imageTitle, c.legend],
    imageDescription: [...acc.imageDescription, c.file.alternativeText],
    imageCredits: [...acc.imageCredits, c.file.credits],
    imageSpecialUses: [...acc.imageSpecialUses, c.specialUses ?? c.file.specialUses],
  }), {
    imageUrl: [],
    imageTitle: [],
    imageDescription: [],
    imageCredits: [],
    imageSpecialUses: [],
  });
const toVideo = (attachments) => attachments
  .filter(attachment => attachment.file.mime.startsWith('video/'))
  .reduce((acc, a, i) => ({
    videoEmbed: i === 0 ? a.file.url : acc.videoEmbed,
  }), { videoEmbed: null });
const toCategories = (categories) => categories.reduce((acc, c) => ({
  categories: [...acc.categories, c.name],
}), {
  categories: [],
});
const sign = (article) => {
  if (article.signature)
    return article.signature;
  if (article.createdBy && article.createdBy.firstname && article.createdBy.lastname)
    return `${article.createdBy.firstname} ${article.createdBy.lastname}`;
  return '';
};

module.exports = ({ strapi }) => {
  const { config, articlesTable: TableName = '' } = strapi.plugin('etx-studio').config('dynamodb');
 
  let client;
  try {
    client = new DynamoDBClient(config);
  } catch (error) {
    strapi.log.error('Cannot start the DynamoDB Client', error);
    client = null;
  }

  return {
    async send(article, action = 'add') {
      if (!client) return strapi.log.warn('No DynamoDB client');
      strapi.log.info('[START] plugin::etx-studio.service::dynamo.send ' + article.id);

      try {
        const payload = {
          sourceType: 'rn',
          sourceLang: article.locale,
          title: article.title,
          // @todo: sanitize html
          textHeader: '<p>' + article.header + '</p>',
          textDescription: article.content,
          publicationDate: article.publishedAt ?? new Date().toISOString(),
          typeName: 'article',
          publisherDomain: 'relaxnews.com',
          // @todo find the platform from the source component
          platformName: (article.source ?? []).some(s => s.__component === 'providers.afp') ? 'AFP' : 'ETX Daily Up',
          terms: (article.lists.intents ?? [])
            .concat(article.lists.themes ?? [])
            .map(term => ({ type: term.code, name: term.name })),
          sourceUrl: null,
          signature: sign(article),
          // @todo find the component for tags
          tagInternationalEN: String(+article.tags?.international_EN),
          tagInternationalFR: String(+article.tags?.international_FR),
          tagFrance: String(+article.tags?.france_FR),
          mainCategory: article.main_category?.name ?? null,
          ...toCategories(article.categories || []),
          ...toImages(article.attachments || []),
          ...toVideo(article.attachments || []),
          metadata: {}
        };
        const Item = marshall({
          'es-indexed': '0',
          uuid: `news_${article.id}`,
          action,
          creation_date: new Date().toISOString(),
          'data-json': JSON.stringify(payload),
          'doc-type': 'news',
          lang: article.locale,
          wcmId: article.id.toString(),
         }, { removeUndefinedValues: true });
        await client.send(new PutItemCommand({
          TableName,
          Item,
        }));
      } catch (error) {
        strapi.log.error('plugin::etx-studio.service::dynamo.send', error);
        throw new ValidationError(error.message);
      } finally {
        strapi.log.info('[END] plugin::etx-studio.service::dynamo.send ' + article.id);
      }

    },
    async sendById(id, populate = '*') {
      const article = await strapi.entityService.findOne('api::article.article', id, { populate });
      return this.send(article);
    },
  };
};