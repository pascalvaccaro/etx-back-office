module.exports = [
  {
    method: 'GET',
    path: '/oembed/:platform',
    handler: 'oembed.index',
    config: {
      policies: [],
    },
  },
];
