const oldUsers = require('./biz_users.json');

const SQL_SELECT_FIELDS = `
  biz_news.id AS newsId,
  biz_news.cId AS cId,
  biz_content.title AS title,
  biz_content.description AS header,
  biz_content.text AS content,
  biz_news.siteId AS siteId,
  biz_news.channelId as channel,
  biz_news.channelIds as channels,
  biz_news.listIds as lists,
  biz_news.createdAt AS newsCreatedAt,
  biz_news.modifiedAt AS newsUpdatedAt,
  biz_news.publicationDate AS publishedAt,
  biz_news.workflowState as status,
  biz_news.tagInternationalFR AS international_FR,
  biz_news.tagInternationalEN AS international_EN,
  biz_news.tagFrance AS france,
  biz_news.signature AS signature,
  biz_news.source AS sourceId,
  biz_news.createdBy AS authorId,
  biz_photo.id AS photoId,
  biz_photo.title AS legend,
  biz_photo.original AS name,
  biz_photo.permalinks AS url,
  biz_photo.formats,
  biz_photo.credits,
  biz_photo.specialUses,
  biz_photo.keywords,
  biz_photo.createdAt,
  biz_photo.modifiedAt,
  biz_photo.publicationDate
`;
const SQL_IMAGES_QUERY = `SELECT 
  ${SQL_SELECT_FIELDS}
FROM biz_photo
LEFT JOIN biz__relation ON biz_photo.id=biz__relation.destinationId AND biz__relation.destinationClass = 'photo'
JOIN biz_news ON biz__relation.sourceId=biz_news.id AND biz__relation.sourceClass = 'news'
JOIN biz_content ON biz_news.id=biz_content.referentId
`;
const SQL_NEWS_QUERY = `SELECT 
  ${SQL_SELECT_FIELDS}
FROM biz_news
LEFT JOIN biz__relation ON biz_news.id=biz__relation.sourceId AND biz__relation.sourceClass = 'news'
JOIN biz_photo ON biz_photo.id=biz__relation.destinationId AND biz__relation.destinationClass = 'photo'
JOIN biz_content ON biz_news.id=biz_content.referentId
`;

const siteIdToLocale = {
  4: 'en',
  5: 'fr'
};
const sourceIdToPlatform = {
  10: 'AFP',
  12: 'ETX Studio'
};
const authorIdToEmail = Object.fromEntries(oldUsers.map(user => [user.id, user.email]));

module.exports = {
  SQL_IMAGES_QUERY,
  SQL_NEWS_QUERY,
  SQL_SELECT_FIELDS,
  siteIdToLocale,
  sourceIdToPlatform,
  authorIdToEmail,
};
