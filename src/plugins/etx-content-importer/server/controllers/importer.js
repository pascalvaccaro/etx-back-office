'use strict';

module.exports = {
  index(ctx) {
    ctx.body = '';
  },
  async extract(ctx) {
    const { url, type } = ctx.query;
    switch (type) {
      case 'html':
        ctx.response.set('Content-Type', 'text/html');
        break;
      case 'rss':
        ctx.response.set('Content-Type', 'application/rss+xml');
        break;
      case 'json':
        ctx.response.set('Content-Type', 'application/json');
    }
    ctx.body = await strapi.plugin('etx-content-importer').service('extractor').extractContent(url, type);
  },
};
