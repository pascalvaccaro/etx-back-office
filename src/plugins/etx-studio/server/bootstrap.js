'use strict';
const wcmUsers = require('./utils/biz_users.json');
const lists = require('./utils/biz_lists.json');

module.exports = async ({ strapi }) => {
  const service = strapi.plugin('etx-studio').service('wcm');

  try {
    const channels = await service.search('SELECT id, createdAt, createdBy, modifiedAt, modifiedBy, siteId, parentId, title, tokens, iptc FROM biz_channel WHERE workflowState = \'published\' AND siteId IN (4, 5) AND parentId IS NOT NULL ORDER BY tokens ASC, siteId ASC', { highWaterMark: 1 });
    const results = await service.transfer(channels, service.toCategories);
    strapi.log.info(`[channels.beforeLaunch] Imported ${results.success} categories from WCM`);

    await Promise.all(
      Object.entries(lists).map(async ([model, data]) => {
        const factory = await service.toLists(model);
        const results = { attempted: 0, success: 0 };
        for (const datum of data) {
          results.attempted += 1;
          results.success += Boolean(await factory(datum));
        }
        strapi.log.info(`[lists.beforeLaunch] Imported ${results.success} ${model}s from WCM out of ${results.attempted}`);
      }));
  } catch (err) {
    strapi.log.error('[bootstrap] ' + err.message);
  }

  strapi.db.lifecycles.subscribe(async (event) => {
    if (event.action === 'afterCreate' && event.model.uid === 'admin::user') {
      const { email } = event.params.data;
      const wcmUser = wcmUsers.find(u => u.email === email);
      if (wcmUser) {
        const sql = await service.buildArticleQuery(' AND biz_news.createdBy = ' + wcmUser.id);
        const rows = await service.search(sql, { highWaterMark: 50 });
        const results = await service.transfer(rows, service.toArticles);
        strapi.log.info(`[user.afterCreate] Imported ${results.success} articles for author ${email}`);
      }
    }
  });
  // const admins = await strapi.entityService.findMany('admin::user');
  // const emails = admins.map(ad => ad.email);
  // const candidates = wcmUsers.filter(u => !!u.email && !emails.includes(u.email));
  // if (candidates.length >= 1) await Promise.all(candidates.map(candidate => strapi.entityService.create('admin::user', {
  //   data: {
  //     email: candidate.email,
  //     firstname: candidate.firstname,
  //     lastname: candidate.lastname,
  //   }
  // })))
  // .then((results) => strapi.log.info(`[BOOTSTRAP] Imported ${results.length} new users out of ${candidates.length} candidates.` ))
  // .catch(err => strapi.log.error(err.message));
};
