'use strict';
const axios = require('axios');

/**
 * afp service.
 */

module.exports = ({ strapi }) => {
  const credentials = {};
  const { username = '', password = '', client_id, client_secret, domain: AFP_DOMAIN = 'https://afp-apicore-prod.afp.com' } = strapi.plugin('etx-studio').config('afp', {});

  const authenticate = async (requestUrl) => {
    if (!credentials.access_token || !credentials.expires_in) {
      const endpoint = new URL('/oauth/token', AFP_DOMAIN);
      const body = new URLSearchParams({ username, password, grant_type: 'password' });
      await axios.post(
        endpoint.toString(), body, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: client_id,
            password: client_secret,
          }
        })
        .then(res => Object.assign(credentials, res.data))
        .catch(() => undefined);
    }
    const isStringUrl = typeof requestUrl === 'string';
    if (isStringUrl) requestUrl = new URL(requestUrl);
    requestUrl.searchParams.append('access_token', credentials.access_token);
    return isStringUrl ? requestUrl.toString() : requestUrl;
  };

  const querify = body => {
    return body;
  };
  const defaultHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  return {
    async listFacet(query) {
      const { name, lang = 'fr', search } = query;
      const endpoint = new URL(`/v1/api/list/${name}`, AFP_DOMAIN);
      endpoint.searchParams.append('minDocCount', 1);
      endpoint.searchParams.append('size', 100);
      const body = {
        lang,
        ...(search ? { query: { AND: [{ name, AND: [search] }] } } : null)
      };

      const requestUrl = await authenticate(endpoint.toString());
      const response = await axios.post(requestUrl, body, { headers: defaultHeaders }).then(res => res.data.response);
      return (response.status.code === 0) ? response.topics : [];
    },
    async search(query) {
      const endpoint = new URL('/v1/api/search', AFP_DOMAIN);
      const requestUrl = await authenticate(endpoint.toString());

      const response = await axios.post(requestUrl, querify(query), { headers: defaultHeaders })
        .then(res => res.data.response);
      return (response.status.code === 0) ? response.docs : [];
    },

    toAttachments() {
      return () => [];
    },
    async toArticles(infos) {
      const categoryNames = infos.map(info => info.keyword);
      const toCategories = await strapi.service('api::category.category').findThenGetByNames(categoryNames);

      return (info) => ({
        title: info.title,
        header: info.headline,
        content: info.news.map(el => `<p>${el}</p>`),
        categories: toCategories(info.categories),
        source: [{
          __component: 'providers.afp',
          externalId: info.uno,
          publicationDate: new Date(info.published),
          wordCount: info.wordCount,
        }],
      });
    },

    toLocales() {
      return (info) => (info.lang || 'fr').slice(0, 2);
    }
  };
};
