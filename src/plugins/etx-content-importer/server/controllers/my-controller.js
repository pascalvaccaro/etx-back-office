'use strict';

module.exports = {
  index(ctx) {
    ctx.body = strapi
      .plugin('etx-content-importer')
      .service('myService')
      .getWelcomeMessage();
  },
};
