'use strict';
const axios = require('axios');

module.exports = ({ strapi }) => {
  return {
    fetchEmbed(url) {
      const endpoint = new URL('/oembed', 'https://www.tiktok.com');
      endpoint.searchParams.set('url', url);
      return axios.get(endpoint.toString()).then(res => res.data);
    }
  };
};
