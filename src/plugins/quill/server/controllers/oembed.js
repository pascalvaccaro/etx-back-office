'use strict';

/**
 * A set of functions called "actions" for `oembed`
 */

module.exports = {
  index: async (ctx) => {
      const { platform } = ctx.params;
      const { url } = ctx.query;
      const embed = await strapi.plugin('quill')
        .service(platform)
        .fetchEmbed(url)
        .catch(err => strapi.log.error(err));

      ctx.body = embed || { html: `<a href="${url}" target="_blank">${url}</a>` };
  }
};
