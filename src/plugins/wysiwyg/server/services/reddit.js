'use strict';
const axios = require('axios');

/**
 * reddit service.
 */

module.exports = () => ({
  fetchEmbed(url) {
    const endpoint = new URL('/oembed', 'https://reddit.com');
    endpoint.searchParams.set('url', url);

    return axios.get(endpoint.toString()).then(res => res.data);
  }
});
