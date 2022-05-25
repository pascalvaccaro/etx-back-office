'use strict';
const axios = require('axios');

/**
 * samba service.
 */

module.exports = ({ strapi }) => {
  const SAMBA_DOMAIN = 'https://samba.etx.studio';
  const AVAILABLE_FACETS = [
    'brands', 'concepts', 'terms', 'publishers', 'categories', 'people'
  ];
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const oauth_token = strapi.plugin('etx-studio').config('samba.token', '');
  const toAuthRequest = (headers) => {
    if (typeof headers !== 'object' || !headers) headers = defaultHeaders;
    headers.Authorization = `Bearer ${oauth_token}`;
    return headers;
  };

  return {
    async listFacet(query) {
      const { name, lang = 'fr' } = query;
      const endpoint = new URL('/api/v1/content/complete', SAMBA_DOMAIN);
      endpoint.searchParams.append('lang', lang);
      endpoint.searchParams.append('q', name);
      endpoint.searchParams.append('size', 100);

      const response = await axios.get(endpoint.toString(), { headers: toAuthRequest() }).then(res => res.data);
      return response.status === 'ok' ? response.data[name] : [];
    },
    async search(query) {
      const endpoint = new URL('/api/v1/content/search', SAMBA_DOMAIN);
      endpoint.searchParams = new URLSearchParams(query);

      const response = await axios.post(endpoint.toString()).then(res => res.data);
      return (response.status === 'ok') ? response : { data: [], meta: { count: 0 }, status: 'error' };
    },
    
    toAttachments(news) {
      const allAttachments = news.map(newsItem => newsItem.images.map((image) => ({
        name: image.title,
        caption: `${image.description} :: ${image.credits} :: ${image.special_uses}`,
        alternativeText: '',
        mime: 'image/jpg',
        url: image.source,
        sourceId: newsItem.id,
      }))).flat();

      return article => allAttachments.filter(attachment => attachment.sourceId === article.source[0].externalId);
    },

    async toArticles(news, user) {
      const categoryNames = news.map(newsItem => newsItem.categories);
      const toCategories = await strapi.service('api::category.category').findThenGetByNames(categoryNames);

      return (newsItem) => ({
        title: newsItem.title,
        header: newsItem.header,
        content: newsItem.content,
        externalUrl: newsItem.source,
        categories: toCategories(newsItem.categories),
        source: [{
          __component: 'providers.samba',
          externalId: newsItem.id,
          audioUrl: newsItem.object_url,
        }],
        createdBy: user.id,
        updatedBy: user.id,
        updatedAt: new Date(newsItem.update_date),
        publishedAt: new Date(newsItem.publication_date)
      });
    },
    
    toLocales() {
      return (newsItem) => (newsItem.lang || 'fr').slice(0, 2);
    }
  };
};
