'use strict';
const wcmUsers = require('./utils/biz_users.json');

module.exports = async ({ strapi }) => {
  const admins = await strapi.entityService.findMany('admin::user');
  const emails = admins.map(ad => ad.email);
  const candidates = wcmUsers.filter(u => !!u.email && !emails.includes(u.email));
  if (candidates.length >= 1) await Promise.all(candidates.map(candidate => strapi.entityService.create('admin::user', {
    data: {
      email: candidate.email,
      firstname: candidate.firstname,
      lastname: candidate.lastname,
    }
  })))
  .then((results) => strapi.log.info(`[BOOTSTRAP] Imported ${results.length} new users out of ${candidates.length} candidates.` ))
  .catch(err => strapi.log.error(err.message));
};
