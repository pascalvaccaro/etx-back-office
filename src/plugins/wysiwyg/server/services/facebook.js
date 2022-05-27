'use strict';

const axios = require('axios');

/**
 * facebook service.
 */

module.exports = () => ({
  fetchEmbed(url, locale = 'fr') {
    const endpoint = new URL('/v14.0/oembed_post', 'https://graph.facebook.com');
    endpoint.searchParams.set('url', url);
    endpoint.searchParams.set('sdklocale', locale);
    endpoint.searchParams.set('omitscript', false);
    endpoint.searchParams.set('useiframe', false);

    return axios.get(endpoint.toString()).then(res => res.data);
  }
});
