'use strict';
const axios = require('axios');

/**
 * spotify service.
 */

module.exports = () => ({
  fetchEmbed(url) {
    const endpoint = new URL('/oembed', 'https://open.spotify.com');
    endpoint.searchParams.set('url', url);

    return axios.get(endpoint.toString()).then(res => res.data);
  }
});
