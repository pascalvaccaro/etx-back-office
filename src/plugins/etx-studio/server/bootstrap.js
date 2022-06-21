'use strict';
const wcmUsers = require('./utils/biz_users.json');

module.exports = async ({ strapi }) => {
  strapi.db.lifecycles.subscribe(async (event) => {
    if (event.action === 'afterCreate' && event.model.uid === 'admin::user') {
      const { email } = event.params.data;
      const wcmUser = wcmUsers.find(u => u.email === email);
      if (wcmUser) {
        const service = strapi.plugin('etx-studio').service('wcm');
        const sql = await service.buildArticleQuery(' AND biz_news.createdBy = ' + wcmUser.id);
        const rows = await service.search(sql);
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
