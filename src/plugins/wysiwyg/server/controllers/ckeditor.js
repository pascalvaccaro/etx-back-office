'use strict';

const path = require('path');
const unzip = require('unzipper');
const strapi = require('@strapi/strapi');

module.exports = {
  index(ctx) {
    ctx.body = '';
  },
  async update(ctx) {
    const targetPath = path.join(process.cwd(), 'ckeditor5-build');
    const zip = ctx.request.files.file;
    unzip.Open.file(zip.path)
      .then((d) => d.extract({ path: targetPath }))
      .then(() => {
        strapi.server.close();
        process.send('reload');
      });
    ctx.status = 202;
    ctx.body = 'success';
  },
};
