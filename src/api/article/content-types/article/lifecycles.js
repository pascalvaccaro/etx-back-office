const { ValidationError } = require('@strapi/utils').errors;

const FORBIDDEN_FIELDS_AFTER_PUBLISH = ['title', 'header', 'content', 'signature', 'main_category'];

module.exports = {
  async beforeUpdate(event) {
    const { data = {}, where = {} } = event.params;
    const article = await strapi.entityService.findOne('api::article.article', where.id, { populate: ['*', 'attachments.file', 'lists.intents', 'lists.themes'] });
    const isPublished = !!article.publishedAt;
    const isPublishing = data.publishedAt && !isPublished;

    if (isPublishing)
      await strapi.plugin('etx-studio').service('dynamo').send(article);
    else if (isPublished && Object.keys(data).some(key => FORBIDDEN_FIELDS_AFTER_PUBLISH.includes(key)))
      throw new ValidationError(
        'Vous ne pouvez pas éditer cet article car il a été publié. Veuillez d\'abord le dépublier, puis enregistrer vos modifications en brouillon, pour enfin le republier.'
      );
  }
};