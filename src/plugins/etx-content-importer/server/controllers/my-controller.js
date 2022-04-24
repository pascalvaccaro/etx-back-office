'use strict';
const { extract } = require('article-parser');

module.exports = {
  index(ctx) {
    ctx.body = strapi
      .plugin('etx-content-importer')
      .service('myService')
      .getWelcomeMessage();
  },
  async extract(ctx) {
    const url = ctx.query.url;
    const result = await extract(url);
    return result;
  }
};
