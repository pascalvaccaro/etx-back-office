'use strict';

module.exports = {
  index(ctx) {
    ctx.body = '';
  },
  async search(ctx) {
    const { query, params } = ctx;
    const articles = await strapi.plugin('etx-studio').service(params.service).search(query);
    return articles || [];
  },
  async extract(ctx) {
    const { accept } = ctx.request.headers;
    const type = accept === 'application/xml+rss' ? 'rss' : accept.includes('text/html') ? 'html' : 'json';

    switch (type) {
      case 'html':
        ctx.response.set('Content-Type', 'text/html');
        break;
      case 'rss':
        ctx.response.set('Content-Type', 'application/xml+rss');
        break;
      case 'json':
        ctx.response.set('Content-Type', 'application/json');
    }
    ctx.body = await strapi.plugin('etx-studio').service('extractor').extractContent(ctx.query.url, type);
  },
};
