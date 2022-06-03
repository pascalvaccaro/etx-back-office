'use strict';

module.exports = async ({ strapi }) => {
  const service = strapi.plugin('etx-studio').service('wcm');
  if (!service || typeof service.search !== 'function' || typeof service.transfer !== 'function') return;

  const results = await service.buildQuery('LIMIT 10')
    .then(sql => service.search(sql, { highWaterMark: 10 }))
    .then(rows => service.transfer(rows))
    .catch(err => strapi.log.error(err));
  
  strapi.log.info(`[WCM] Imported ${results?.success ?? 0} out of ${results?.attempt ?? 0} found assets`);
};
