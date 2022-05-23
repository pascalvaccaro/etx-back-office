'use strict';

/**
 *  article controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async createFromExternalProvider(ctx) {
    const { provider = '' } = ctx.params;

    const service = await strapi.service(`api::article.${provider.toLowerCase()}`);
    ctx.request.body = await service.toArticle(ctx.request.body);
    const data = await super.create(ctx);

    ctx.response.status = 201;
    return { data };
  }
}));
