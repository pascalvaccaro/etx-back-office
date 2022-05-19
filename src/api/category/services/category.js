'use strict';

/**
 * category service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::category.category', ({ strapi }) => ({
  async findThenGetByNames(names = []) {
    const $in = names.flat().reduce((acc, c) => acc.includes(c) ? acc : [...acc, c], []);
    const existing = await strapi.entityService.findMany('api::category.category', {
      filters: { name: { $in } }
    });
    return incoming => incoming.map(name => {
      const [category] = existing.find((c) => c.name === name);
      return category || { name };
    });
  }
}));
