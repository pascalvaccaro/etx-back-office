'use strict';

const axios = require('axios');

/**
 * instagram service.
 */

module.exports = () => ({
  fetchEmbed(url) {
    const endpoint = new URL('/v14.0/instagram_oembed', 'https://graph.facebook.com');
    endpoint.searchParams.set('url', url);
    endpoint.searchParams.set('omitscript', false);
    endpoint.searchParams.set('hidecaption', false);

    return axios.get(endpoint.toString()).then(res => res.data);
  }
});
