'use strict';

const fromJsonLogic = (data, logic = { and: [] }) =>
  logic.and.reduce((acc, operations) => {
    for (const op in operations) {
      const [field, value] = operations[op] ?? [];
      if (!field || !field.var) return acc;
      if (op === '>=') {
        acc[field.var] = { $gte: value };
      } else if (op === 'in') {
        acc[field.var] = [...(acc[field.var] ?? []), value];
      } else if (op === '===') {
        acc[field.var] = value;
      }
    }
    return acc;
  }, data);

/**
 * stats service.
 */

module.exports = ({ strapi }) => ({
  async listFacet(query) {
    const { search } = query;
    const results = await strapi.entityService.findMany('admin::user', {
      filters: {
        $or: [
          { firstname: { $startsWith: search } },
          { lastname: { $startsWith: search } },
        ]
      },
    });

    return results.map(result => ({ ...result, name: result.firstname + ' ' + result.lastname }));
  },

  async search(body) {
    const filters = fromJsonLogic(body.data, body.logic);
    const results = await strapi.entityService.findMany('api::article.article', {
      filters: {
        $and: Object.entries(filters)
          .map(([key, value]) => value ? ({ [key]: value }) : null)
          .filter(Boolean)
          .concat(...['lists', 'main_category'].map(key => ({ [key]: { $not: null } }))),
      },
      locale: 'all',
      populate: {
        main_category: true,
        createdBy: true,
        // updatedBy: true,
        // tags: true,
        source: true,
        lists: {
          filters: {
            $and: [
              { intents: { $not: null } },
              { themes: { $not: null } },
            ],
          },
          populate: ['intents', 'themes'],
        }
      },
    });
    return results;
  }
});
