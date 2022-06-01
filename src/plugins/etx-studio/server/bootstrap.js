'use strict';

module.exports = async ({ strapi }) => {
  const service = strapi.plugin('etx-studio').service('wcm');
  if (!service || typeof service.search !== 'function' || typeof service.transfer !== 'function') return;

  const imagesToLoad = await service.search();
  if (!imagesToLoad.length) return strapi.log.info('No new images to load from WCM');

  strapi.log.warn('About to import ' + imagesToLoad.length + ' images from WCM Database...');
  const imagesLoaded = await service.transfer(imagesToLoad);
  strapi.log.info(`Imported ${imagesLoaded.length} out of ${imagesToLoad.length} found assets`);
};
