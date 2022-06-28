const { errors, nameToSlug } = require('@strapi/utils');

const FORBIDDEN_FIELDS_AFTER_PUBLISH = ['title', 'header', 'content', 'signature', 'main_category'];

module.exports = {
  async beforeCreate(event) {
    const { localizations } = event.params.data;
    const [relatedId] = localizations ?? [];
    if (relatedId) {
      await strapi.entityService.update('api::article.article', relatedId, { data: { translate: false } });
      event.params.data.translate = false;
    }
  },
  async beforeUpdate(event) {
    const { data = {}, where = {} } = event.params;
    const article = await strapi.entityService.findOne('api::article.article', where.id, { populate: ['*', 'attachments.file', 'lists.intents', 'lists.themes'] });
    const isPublished = !!article.publishedAt;
    const isPublishing = data.publishedAt && !isPublished;
    event.params.data.slug = nameToSlug(data.title ?? article.title);
    
    if (isPublishing) {
      event.params.data.submitted = false;
      await strapi.plugin('etx-studio').service('dynamo').send(article);
    }
    else if (isPublished && Object.keys(data).some(key => FORBIDDEN_FIELDS_AFTER_PUBLISH.includes(key)))
      throw new errors.ValidationError(
        'Vous ne pouvez pas éditer cet article car il a été publié. Veuillez d\'abord le dépublier, puis enregistrer vos modifications en brouillon, pour enfin le republier.'
      );
  }
};