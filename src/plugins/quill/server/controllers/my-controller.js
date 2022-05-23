'use strict';

module.exports = {
  index(ctx) {
    ctx.body = strapi
      .plugin('quill')
      .service('myService')
      .getWelcomeMessage();
  },
};
