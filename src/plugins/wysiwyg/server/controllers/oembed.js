'use strict';

const { NotFoundError } = require('@strapi/utils').errors;
const services = require('../services');
const platforms = Object.keys(services).join('|');
const re = new RegExp(platforms, 'i');

const findPlatform = (url) => {
  const [platform] = url.match(re);
  if (!platform) throw new NotFoundError('No platform found in URL ', url);
  return platform;
};

/**
 * A set of functions called "actions" for `oembed`
 */
module.exports = {
  index: async (ctx) => {
    const { url } = ctx.query;
    const platform = findPlatform(url);
    const embed = await strapi.plugin('wysiwyg')
      .service(platform)
      .fetchEmbed(url)
      .catch(err => strapi.log.error(err));

    ctx.body = embed || { html: `<a href="${url}" target="_blank">${url}</a>` };
  }
};
