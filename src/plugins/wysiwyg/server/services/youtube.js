'use strict';

const axios = require('axios');

/**
 * youtube service.
 */

module.exports = () => ({
  fetchEmbed(url) {
    const endpoint = new URL('/oembed', 'https://youtube.com');
    endpoint.searchParams.set('url', url);

    return axios.get(endpoint.toString())
      .then(res => res.data);
  }
});
