'use strict';

/**
 * afp service.
 */

module.exports = ({ strapi }) => ({
  async toArticle(body) {
    const [categories, ...whateverYouWant] = await Promise.all([
      strapi.entityService.findMany('api::category.category', {
        filters: {
          name: {
            $in: body.categories, 
          }
        }
      })
    ]);

    return {
      title: body.title,
      header: body.chapeau,
      content: body.text,
      categories,
      locale: body.language.slice(0, 2).toLowerCase(),
    }
  }
});
