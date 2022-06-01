module.exports = {
  async beforeUpdate(event) {
    const { data = {}, where = {} } = event.params;
    if (data.publishedAt && where.id)
      await strapi.plugin('etx-studio').service('dynamo').sendById(where.id);
  }
};