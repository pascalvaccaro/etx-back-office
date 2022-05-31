module.exports = {
  async beforeUpdate(event) {
    const { params, where } = event;
    const { publishedAt } = params.data;
    if (publishedAt)
      await strapi.plugin('etx-studio').service('dynamo').sendById(where.id);
  }
  // afterUpdate(event) {
  //   const { params, result } = event;
  //   const { publishedAt } = params.data;
  //   if (publishedAt)
  //   strapi.plugin('etx-studio').service('dynamo').send(result);
  // }
};