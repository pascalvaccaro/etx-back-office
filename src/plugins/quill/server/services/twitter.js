'use strict';
const axios = require('axios');

module.exports = ({ strapi }) => {
  return {
    fetchEmbed(url, locale = 'fr') {
      const endpoint = new URL('/oembed', 'https://publish.twitter.com');
      endpoint.searchParams.set('omit_script', '1');
      endpoint.searchParams.set('lang', locale);
      endpoint.searchParams.set('url', url);

      return axios.get(endpoint.toString())
        .then(res => res.data);
    },
  };
};