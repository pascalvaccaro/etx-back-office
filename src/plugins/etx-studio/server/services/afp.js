'use strict';
const axios = require('axios');

/**
 * afp service.
 */


module.exports = ({ strapi }) => {
  const AFP_DOMAIN = 'https://afp-apicore-prod.afp.com';
  const oauth_token = strapi.plugin('etx-studio').config('afp.token', '');
  const toAuthRequest = url => {
    if (typeof url === 'string') url = new URL(url);
    url.searchParams.append('oauth_token', oauth_token);
    return url.toString();
  };
  const defaultHeaders = {
    Accept: 'application/json'
  };

  return {
    async listFacet(query) {
      const { name, lang = 'fr' } = query;
      const endpoint = new URL(`/v1/api/list/${name}`, AFP_DOMAIN);
      endpoint.searchParams.append('lang', lang);
      endpoint.searchParams.append('minDocCount', 1);
      endpoint.searchParams.append('size', 100);

      const response = await axios.get(toAuthRequest(endpoint), { headers: defaultHeaders }).then(res => res.data.response);
      return (response.status.code === 0) ? response.topics : [];
    },
    async search(query) {
      const endpoint = new URL('/V1/api/search', AFP_DOMAIN);
      const options = {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
      };

      const response = await axios.post(toAuthRequest(endpoint), options).then(res => res.data.response);
      return (response.status.code === 0) ? response.docs : [];
    }
  };
};
