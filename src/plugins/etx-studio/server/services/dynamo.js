const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { ValidationError } = require('@strapi/utils').errors;

const toImages = (attachments) => attachments
  .filter(attachment => attachment.mime.startsWith('image/'))
  .reduce((acc, c) => ({
    imageUrl: [...acc.imageUrl, c.url],
    imageTitle: [...acc.imageTitle, c.legend],
    imageDescription: [...acc.imageDescription, c.alternativeText],
    imageCredits: [...acc.imageCredits, c.credits],
    imageSpecialUses: [...acc.imageSpecialUses, c.specialUses],
  }), {
    imageUrl: [],
    imageTitle: [],
    imageDescription: [],
    imageCredits: [],
    imageSpecialUses: [],
  });
const toVideo = (attachments) => attachments
  .filter(attachment => attachment.mime.startsWith('video/'))
  .reduce((acc, c, i) => ({
    videoEmbed: i === 0 ? c.url : acc.videoEmbed,
  }), { videoEmbed: null });
const toCategories = (categories) => categories.reduce((acc, c) => ({
  categories: [...acc.categories, c.name],
}), {
  categories: [],
});
const sign = (article) => {
  if (article.source && article.source.signature)
    return article.source.signature;
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
          platformName: 'ETX Daily Up',
          terms: (article.lists.intents ?? [])
            .map(intent => ({ type: 'intent', name: intent.name })),
          sourceUrl: null,
          signature: sign(article),
          // @todo find the component for tags
          tagInternationalEN: String(+article.lists.international_EN),
          tagInternationalFR: String(+article.lists.international_FR),
          tagFrance: String(+article.lists.france),
          mainCategory: article.main_category.name,
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
    async sendById(id) {
      const article = await strapi.entityService.findOne('api::article.article', id, { populate: '*' });
      return this.send(article);
    },
  };
};