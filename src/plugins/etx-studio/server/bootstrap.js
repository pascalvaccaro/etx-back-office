'use strict';
const wcmUsers = require('./utils/biz_users.json');

module.exports = async ({ strapi }) => {
  const service = strapi.plugin('etx-studio').service('wcm');
  const channels = await service.search('SELECT id, createdAt, createdBy, modifiedAt, modifiedBy, siteId, parentId, title, tokens, iptc FROM biz_channel WHERE workflowState = \'published\' AND siteId IN (4, 5) AND parentId IS NOT NULL ORDER BY tokens ASC, siteId ASC', { highWaterMark: 1 });
  const results = await service.transfer(channels, service.toCategories);
  strapi.log.info(`[channels.beforeLaunch] Imported ${results.success} categories from WCM`);

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
