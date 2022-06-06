'use strict';

module.exports = async ({ strapi }) => {
  const service = strapi.plugin('etx-studio').service('wcm');
  if (!service || typeof service.search !== 'function' || typeof service.transfer !== 'function') return;

  const results = await Promise.all([
    ['image', service.buildImageQuery],
    ['news', service.buildArticleQuery]
  ].map(([model, builder]) => builder('LIMIT 1')
    .then(sql => service.search(sql, { highWaterMark: 10 }))
    .then(rows => service.transfer(rows, model))
    .catch(err => strapi.log.error(err.message))
  ));

  results.forEach(
    (result) => strapi.log.info(`[WCM] Imported ${result?.success ?? 0} out of ${result?.attempt ?? 0} found ${result.model}`)
  );
};
