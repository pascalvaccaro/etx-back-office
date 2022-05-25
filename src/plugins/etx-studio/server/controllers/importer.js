'use strict';
const { errors } = require('@strapi/utils');
const { NotFoundError, ValidationError } = errors;
const { transferFiles, removeFilesFromTmpFolder } = require('../utils/file');

module.exports = {
  index(ctx) {
    ctx.body = '';
  },
  async search(ctx) {
    const { query, params } = ctx;
    const articles = await strapi.plugin('etx-studio').service(params.service).search(query);
    ctx.body = articles || [];
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

  async transfer(ctx) {
    const { body, params } = ctx.request;
    const { user } = ctx.state;
    const service = await strapi.plugin('etx-studio').service(params.service);
    if (!service) throw new NotFoundError(`No service found with name ${params.service}`);
    if (!Array.isArray(body)) throw new ValidationError('Unexpected body type');
    if (!body.length) throw new ValidationError('Empty body');

    const toArticle = await service.toArticles(body, user);
    const toLocale = service.toLocales(body);

    const articles = await Promise.all(
      body.map(item => strapi.entityService.create('api::article.article', {
        data: {
          ...toArticle(item),
          locale: toLocale(item),
          ...(user ? { createdBy: user.id } : null)
        },
        populate: ['source'],
      }))
    );
    const attachments = articles.map(service.toAttachments(body));
    const finder = (sourceId) => articles.find(article => article.source[0].externalId === sourceId)?.id || null;

    const uploads = [];
    for await (const { files, metas, fileInfo } of transferFiles(attachments, finder)) {
      uploads.push(strapi.plugin('upload').service('upload').upload({
        data: { fileInfo, ...metas },
        files,
      }));
    }

    await Promise.all(uploads).finally(() => attachments.map(removeFilesFromTmpFolder));

    ctx.body = articles;
  }
};
