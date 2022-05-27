'use strict';

const axios = require('axios');

/**
 * facebook service.
 */

module.exports = () => ({
  fetchEmbed(url) {
    return axios.get(url, { responseType: 'text' }).then(res => res.data).then(html => ({ html, type: 'rich' }));
  }
});
