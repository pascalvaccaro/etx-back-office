'use strict';
const { extract } = require('article-parser');
const fetch = require('node-fetch');

module.exports = ({ strapi }) => ({
  extractContent(url, type) {
    switch (type) {
      case 'html':
        return extract(url);
      case 'rss':
        return fetch(url).then(res => res.text());
      case 'json':
        return fetch(url).then(res => res.json());
      default:
        return fetch(url).then(res => res.text());
    }
  }
});
