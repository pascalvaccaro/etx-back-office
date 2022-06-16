const { ValidationError } = require('@strapi/utils').errors;

module.exports = {
  async beforeUpdate(event) {
    const { data = {}, where = {} } = event.params;
    const article = await strapi.entityService.findOne('api::article.article', where.id, { populate: '*' });

    if (data.publishedAt && !article.publishedAt)
      await strapi.plugin('etx-studio').service('dynamo').send(article);
    else if (!data.publishedAt && article.publishedAt)
      throw new ValidationError('Vous ne pouvez pas éditer un article qui a été publié. Veuillez d\'abord le dépublier.');
  }
};